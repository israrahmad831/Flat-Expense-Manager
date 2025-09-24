import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const transactionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.string().min(1, "Category is required"),
  walletId: z.string().min(1, "Wallet is required"),
  toWalletId: z.string().optional(), // For transfers
  date: z.string().datetime(),
  description: z.string().optional(),
  teamId: z.string().optional(), // For team expenses
  splitAmong: z.array(z.string()).optional(), // Team member IDs
  splitType: z.enum(["equal", "custom"]).optional(),
  customSplits: z.record(z.string(), z.number()).optional() // userId -> amount
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get("walletId")
    const type = searchParams.get("type") // income, expense, transfer
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    const client = await clientPromise
    const db = client.db()
    const transactions = db.collection("transactions")
    const wallets = db.collection("wallets")

    let query: any = { userId: session.user.id }
    
    if (walletId) {
      // Verify wallet belongs to user
      const wallet = await wallets.findOne({
        _id: new ObjectId(walletId),
        userId: session.user.id
      })
      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
      }
      query.walletId = walletId
    }

    if (type) {
      query.type = type
    }

    const skip = (page - 1) * limit
    const userTransactions = await transactions
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await transactions.countDocuments(query)

    return NextResponse.json({ 
      transactions: userTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const transactionData = transactionSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const transactions = db.collection("transactions")
    const wallets = db.collection("wallets")

    // Start a transaction for atomic operations
    const mongoSession = client.startSession()
    
    try {
      await mongoSession.withTransaction(async () => {
        // Verify wallet belongs to user
        const wallet = await wallets.findOne({
          _id: new ObjectId(transactionData.walletId),
          userId: session.user.id
        })
        if (!wallet) {
          throw new Error("Wallet not found")
        }

        // For transfers, verify destination wallet
        if (transactionData.type === "transfer" && transactionData.toWalletId) {
          const toWallet = await wallets.findOne({
            _id: new ObjectId(transactionData.toWalletId),
            userId: session.user.id
          })
          if (!toWallet) {
            throw new Error("Destination wallet not found")
          }
        }

        // Create transaction
        const transaction = {
          ...transactionData,
          userId: session.user.id,
          date: new Date(transactionData.date),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = await transactions.insertOne(transaction)

        // Update wallet balance
        const balanceChange = transactionData.type === "expense" ? -transactionData.amount : transactionData.amount

        if (transactionData.type === "transfer") {
          // Decrease from source wallet
          await wallets.updateOne(
            { _id: new ObjectId(transactionData.walletId) },
            { $inc: { balance: -transactionData.amount }, $set: { updatedAt: new Date() } }
          )
          // Increase to destination wallet
          await wallets.updateOne(
            { _id: new ObjectId(transactionData.toWalletId!) },
            { $inc: { balance: transactionData.amount }, $set: { updatedAt: new Date() } }
          )
        } else {
          await wallets.updateOne(
            { _id: new ObjectId(transactionData.walletId) },
            { $inc: { balance: balanceChange }, $set: { updatedAt: new Date() } }
          )
        }

        return result
      })
    } finally {
      await mongoSession.endSession()
    }

    return NextResponse.json(
      { message: "Transaction created successfully" },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create transaction error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}