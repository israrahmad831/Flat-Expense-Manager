import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  paidBy: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "custom", "percentage"]),
  splits: z.record(z.string(), z.number())
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("expense_tracker")

    // Check if user is member of the team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.id),
      "members.userId": (session.user as any).id
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get expenses for this team
    const expenses = await db.collection("team_expenses")
      .find({ teamId: params.id })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Get team expenses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const validatedData = expenseSchema.parse(body)

    const client = await clientPromise
    const db = client.db("expense_tracker")

    // Check if user is member of the team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.id),
      "members.userId": (session.user as any).id
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Create the expense
    const expense = {
      ...validatedData,
      teamId: params.id,
      date: new Date().toISOString(),
      createdAt: new Date(),
      _id: new ObjectId()
    }

    await db.collection("team_expenses").insertOne(expense)

    // Update team balances
    await updateTeamBalances(db, params.id, team, expense)

    return NextResponse.json({ 
      message: "Expense added successfully",
      expense 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create team expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateTeamBalances(db: any, teamId: string, team: any, expense: any) {
  const balances = team.balances || {}
  
  // Initialize balances for all members if not exists
  team.members.forEach((member: any) => {
    if (!balances[member.userId]) {
      balances[member.userId] = { owes: 0, shouldReceive: 0 }
    }
  })

  // The person who paid should receive money back
  const paidByBalance = balances[expense.paidBy]
  paidByBalance.shouldReceive += expense.amount

  // Each person in the split owes their portion
  Object.entries(expense.splits).forEach(([userId, amount]) => {
    if (userId === expense.paidBy) {
      // Payer owes less (they paid for themselves)
      paidByBalance.shouldReceive -= (amount as number)
    } else {
      // Others owe their portion
      const userBalance = balances[userId]
      if (userBalance) {
        userBalance.owes += (amount as number)
      }
    }
  })

  // Update the team document with new balances
  await db.collection("teams").updateOne(
    { _id: new ObjectId(teamId) },
    { $set: { balances } }
  )
}