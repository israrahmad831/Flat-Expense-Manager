import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const updateWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required"),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const walletData = updateWalletSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const wallets = db.collection("wallets")

    const result = await wallets.updateOne(
      { 
        _id: new ObjectId(params.id),
        userId: session.user.id 
      },
      { 
        $set: {
          ...walletData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Wallet updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Update wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const wallets = db.collection("wallets")
    const transactions = db.collection("transactions")

    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get("force") === "true"

    // Check if wallet exists and belongs to user
    const wallet = await wallets.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    })

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    // Check if wallet is default and if it's the only wallet
    if (wallet.isDefault) {
      const walletCount = await wallets.countDocuments({ userId: session.user.id })
      if (walletCount === 1) {
        return NextResponse.json({ 
          error: "Cannot delete the only wallet. Create another wallet first." 
        }, { status: 400 })
      }
    }

    // Check for linked transactions
    const linkedTransactions = await transactions.countDocuments({
      $or: [
        { walletId: params.id },
        { toWalletId: params.id }
      ]
    })

    if (linkedTransactions > 0 && !forceDelete) {
      return NextResponse.json({
        error: "Wallet has linked transactions",
        hasTransactions: true,
        transactionCount: linkedTransactions,
        message: `This wallet has ${linkedTransactions} linked transaction(s). Deleting it will also delete all associated transactions. Add ?force=true to confirm deletion.`
      }, { status: 409 })
    }

    // Start a database session for atomic operation
    const mongoSession = client.startSession()

    try {
      await mongoSession.withTransaction(async () => {
        // Delete all linked transactions if force delete
        if (linkedTransactions > 0) {
          await transactions.deleteMany({
            $or: [
              { walletId: params.id },
              { toWalletId: params.id }
            ]
          })
        }

        // Delete the wallet
        await wallets.deleteOne({ _id: new ObjectId(params.id) })

        // If this was the default wallet, make another wallet default
        if (wallet.isDefault) {
          await wallets.updateOne(
            { userId: session.user.id },
            { $set: { isDefault: true, updatedAt: new Date() } }
          )
        }
      })

      return NextResponse.json({ 
        message: "Wallet deleted successfully",
        deletedTransactions: linkedTransactions
      })
    } finally {
      await mongoSession.endSession()
    }
  } catch (error) {
    console.error("Delete wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}