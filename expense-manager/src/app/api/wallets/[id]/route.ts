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

    // Check if wallet has transactions
    const transactionCount = await transactions.countDocuments({ walletId: params.id })
    
    if (transactionCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete wallet with existing transactions. Please delete all transactions first or transfer them to another wallet." 
        },
        { status: 400 }
      )
    }

    const result = await wallets.deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Wallet deleted successfully" })
  } catch (error) {
    console.error("Delete wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}