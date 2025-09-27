import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const updateTransactionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  date: z.string().datetime().optional(),
  description: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const transactions = db.collection("transactions")

    const transaction = await transactions.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Get transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updates = updateTransactionSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const transactions = db.collection("transactions")
    const wallets = db.collection("wallets")

    // Start a database session for transaction
    const mongoSession = client.startSession()

    try {
      await mongoSession.withTransaction(async () => {
        // Get the original transaction
        const originalTransaction = await transactions.findOne({
          _id: new ObjectId(params.id),
          userId: session.user.id
        })

        if (!originalTransaction) {
          throw new Error("Transaction not found")
        }

        // If amount or wallet is being changed, we need to update balances
        const amountChanged = updates.amount && updates.amount !== originalTransaction.amount
        const walletChanged = updates.walletId && updates.walletId !== originalTransaction.walletId

        if (amountChanged || walletChanged) {
          // Revert the original transaction's impact
          const revertAmount = originalTransaction.type === "income" ? -originalTransaction.amount : originalTransaction.amount
          await wallets.updateOne(
            { _id: new ObjectId(originalTransaction.walletId) },
            { $inc: { balance: revertAmount } }
          )

          // Apply the new transaction's impact
          const newAmount = updates.amount || originalTransaction.amount
          const newWalletId = updates.walletId || originalTransaction.walletId
          const newType = updates.type || originalTransaction.type
          const applyAmount = newType === "income" ? newAmount : -newAmount
          
          await wallets.updateOne(
            { _id: new ObjectId(newWalletId) },
            { $inc: { balance: applyAmount } }
          )
        }

        // Update the transaction
        await transactions.updateOne(
          { _id: new ObjectId(params.id) },
          { 
            $set: {
              ...updates,
              updatedAt: new Date()
            }
          }
        )
      })

      return NextResponse.json({ message: "Transaction updated successfully" })
    } finally {
      await mongoSession.endSession()
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Update transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const transactions = db.collection("transactions")
    const wallets = db.collection("wallets")

    // Start a database session for transaction
    const mongoSession = client.startSession()

    try {
      await mongoSession.withTransaction(async () => {
        // Get the transaction to delete
        const transaction = await transactions.findOne({
          _id: new ObjectId(params.id),
          userId: session.user.id
        })

        if (!transaction) {
          throw new Error("Transaction not found")
        }

        // Revert the transaction's impact on wallet balance
        const revertAmount = transaction.type === "income" ? -transaction.amount : transaction.amount
        await wallets.updateOne(
          { _id: new ObjectId(transaction.walletId) },
          { $inc: { balance: revertAmount } }
        )

        // Delete the transaction
        await transactions.deleteOne({ _id: new ObjectId(params.id) })
      })

      return NextResponse.json({ message: "Transaction deleted successfully" })
    } finally {
      await mongoSession.endSession()
    }

  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}