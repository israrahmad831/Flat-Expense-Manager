import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const settleSchema = z.object({
  withUserId: z.string().min(1, "User ID is required")
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { withUserId } = settleSchema.parse(body)

    const client = await clientPromise
    const db = client.db("expense_tracker")

    // Get team and verify membership
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.id),
      "members.userId": { $in: [(session.user as any).id, withUserId] }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const currentUserId = (session.user as any).id
    const balances = team.balances || {}

    // Calculate settlement
    const currentUserBalance = balances[currentUserId] || { owes: 0, shouldReceive: 0 }
    const otherUserBalance = balances[withUserId] || { owes: 0, shouldReceive: 0 }

    // Create settlement record
    const settlement = {
      teamId: params.id,
      fromUser: currentUserId,
      toUser: withUserId,
      amount: Math.min(currentUserBalance.owes, otherUserBalance.shouldReceive),
      date: new Date().toISOString(),
      createdAt: new Date()
    }

    if (settlement.amount > 0) {
      // Record the settlement
      await db.collection("settlements").insertOne(settlement)

      // Update balances
      currentUserBalance.owes -= settlement.amount
      otherUserBalance.shouldReceive -= settlement.amount

      await db.collection("teams").updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { [`balances.${currentUserId}`]: currentUserBalance, [`balances.${withUserId}`]: otherUserBalance } }
      )
    }

    return NextResponse.json({ 
      message: "Settlement recorded successfully",
      settlement 
    })
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