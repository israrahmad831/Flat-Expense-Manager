import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const transferSchema = z.object({
  fromWalletId: z.string().min(1, "From wallet is required"),
  toWalletId: z.string().min(1, "To wallet is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fromWalletId, toWalletId, amount, description } = transferSchema.parse(body)

    if (fromWalletId === toWalletId) {
      return NextResponse.json({ error: "Cannot transfer to the same wallet" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const wallets = db.collection("wallets")
    const transactions = db.collection("transactions")

    // Verify both wallets exist and belong to user
    const [fromWallet, toWallet] = await Promise.all([
      wallets.findOne({ _id: new ObjectId(fromWalletId), userId: session.user.id }),
      wallets.findOne({ _id: new ObjectId(toWalletId), userId: session.user.id })
    ])

    if (!fromWallet) {
      return NextResponse.json({ error: "From wallet not found" }, { status: 404 })
    }

    if (!toWallet) {
      return NextResponse.json({ error: "To wallet not found" }, { status: 404 })
    }

    if (fromWallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Create transfer transactions
    const transferOut = {
      userId: session.user.id,
      title: `Transfer to ${toWallet.name}`,
      amount,
      type: "transfer",
      walletId: fromWalletId,
      toWalletId: toWalletId,
      categoryId: null,
      description: description || `Transfer from ${fromWallet.name} to ${toWallet.name}`,
      date: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const transferIn = {
      userId: session.user.id,
      title: `Transfer from ${fromWallet.name}`,
      amount,
      type: "transfer",
      walletId: toWalletId,
      fromWalletId: fromWalletId,
      categoryId: null,
      description: description || `Transfer from ${fromWallet.name} to ${toWallet.name}`,
      date: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Update wallet balances and create transactions in a transaction
    const session_db = client.startSession()
    
    try {
      await session_db.withTransaction(async () => {
        // Update balances
        await wallets.updateOne(
          { _id: new ObjectId(fromWalletId) },
          { 
            $inc: { balance: -amount },
            $set: { updatedAt: new Date() }
          }
        )

        await wallets.updateOne(
          { _id: new ObjectId(toWalletId) },
          { 
            $inc: { balance: amount },
            $set: { updatedAt: new Date() }
          }
        )

        // Create transaction records
        await transactions.insertMany([transferOut, transferIn])
      })

      return NextResponse.json({ 
        message: "Transfer completed successfully",
        transfer: {
          from: fromWallet.name,
          to: toWallet.name,
          amount,
          description
        }
      })
    } finally {
      await session_db.endSession()
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Transfer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}