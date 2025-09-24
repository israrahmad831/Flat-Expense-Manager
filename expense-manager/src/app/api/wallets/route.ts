import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"

const walletSchema = z.object({
  name: z.string().min(1, "Wallet name is required"),
  balance: z.number().default(0),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const wallets = db.collection("wallets")

    const userWallets = await wallets
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ wallets: userWallets })
  } catch (error) {
    console.error("Get wallets error:", error)
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
    const walletData = walletSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const wallets = db.collection("wallets")

    // Check if this is the user's first wallet
    const existingWallets = await wallets.countDocuments({ userId: session.user.id })
    const isDefault = existingWallets === 0

    const wallet = {
      ...walletData,
      userId: session.user.id,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await wallets.insertOne(wallet)

    return NextResponse.json(
      { message: "Wallet created successfully", walletId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}