import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const settleSchema = z.object({
  withUserId: z.string().min(1, "User ID is required"),
  amount: z.number().positive("Amount must be positive").optional(),
  note: z.string().optional()
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

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Verify user is team member
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.id),
      $or: [
        { createdBy: session.user.id },
        { "members.userId": session.user.id }
      ]
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get settlement history
    const settlements = await db.collection("settlements")
      .find({ teamId: params.id })
      .sort({ createdAt: -1 })
      .toArray()

    // Get team balances for current debt status
    const balances = team.balances || {}
    const currentUserBalance = balances[session.user.id] || { owes: 0, shouldReceive: 0 }

    return NextResponse.json({ 
      settlements,
      currentBalance: currentUserBalance,
      teamBalances: balances
    })
  } catch (error) {
    console.error("Get settlements error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { withUserId, amount, note } = settleSchema.parse(body)

    const client = await clientPromise
    const db = client.db("expense_tracker")

    // Get team and verify membership
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.id),
      "members.userId": { $in: [session.user.id, withUserId] }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const currentUserId = session.user.id
    const balances = team.balances || {}

    // Calculate settlement
    const currentUserBalance = balances[currentUserId] || { owes: 0, shouldReceive: 0 }
    const otherUserBalance = balances[withUserId] || { owes: 0, shouldReceive: 0 }

    // Calculate settlement amount
    const maxOwed = currentUserBalance.owes || 0
    const maxReceivable = otherUserBalance.shouldReceive || 0
    const settlementAmount = amount || Math.min(maxOwed, maxReceivable)

    if (settlementAmount <= 0) {
      return NextResponse.json({ 
        error: "No settlement amount available between these users" 
      }, { status: 400 })
    }

    // Start MongoDB session for transaction
    const mongoSession = client.startSession()

    try {
      await mongoSession.withTransaction(async () => {
        // Create settlement record
        const settlement = {
          teamId: params.id,
          fromUser: currentUserId,
          toUser: withUserId,
          amount: settlementAmount,
          note: note || `Settlement between users`,
          status: "completed",
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection("settlements").insertOne(settlement, { session: mongoSession })

        // Update team balances
        const updateData: any = {}
        updateData[`balances.${currentUserId}.owes`] = Math.max(0, (currentUserBalance.owes || 0) - settlementAmount)
        updateData[`balances.${withUserId}.shouldReceive`] = Math.max(0, (otherUserBalance.shouldReceive || 0) - settlementAmount)
        updateData.updatedAt = new Date()

        await db.collection("teams").updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData },
          { session: mongoSession }
        )
      })

      return NextResponse.json({ 
        message: "Settlement recorded successfully",
        amount: settlementAmount,
        settled: true
      })
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

    console.error("Settlement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}