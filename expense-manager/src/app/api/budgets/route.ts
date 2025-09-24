import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  period: z.enum(["weekly", "monthly", "yearly"]),
  alertThreshold: z.number().min(1).max(100).default(80)
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("expense_tracker")

    // Get user budgets
    const budgets = await db.collection("budgets")
      .find({ userId: (session.user as any).id })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate spent amounts for each budget
    for (const budget of budgets) {
      const startDate = new Date(budget.startDate)
      const endDate = new Date(budget.endDate)

      // Build transaction query
      const query: any = {
        userId: (session.user as any).id,
        type: "expense",
        date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
      }

      if (budget.categoryId) {
        query.categoryId = budget.categoryId
      }

      if (budget.walletId) {
        query.walletId = budget.walletId
      }

      // Calculate spent amount
      const transactions = await db.collection("transactions").find(query).toArray()
      budget.spent = transactions.reduce((sum, t) => sum + t.amount, 0)

      // Update budget with current spent amount
      await db.collection("budgets").updateOne(
        { _id: budget._id },
        { $set: { spent: budget.spent } }
      )
    }

    return NextResponse.json({ budgets })
  } catch (error) {
    console.error("Get budgets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = budgetSchema.parse(body)

    // Calculate period dates
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (validatedData.period) {
      case "weekly":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
    }

    const budget = {
      ...validatedData,
      userId: (session.user as any).id,
      spent: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      createdAt: new Date(),
      _id: new ObjectId()
    }

    const client = await clientPromise
    const db = client.db("expense_tracker")

    await db.collection("budgets").insertOne(budget)

    return NextResponse.json({ 
      message: "Budget created successfully",
      budget 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create budget error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}