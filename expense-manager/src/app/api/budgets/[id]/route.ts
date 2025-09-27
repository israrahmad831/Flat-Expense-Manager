import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

const budgetUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  alertThreshold: z.number().min(1).max(100).optional(),
  isActive: z.boolean().optional()
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
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const budgets = db.collection("budgets")
    const transactions = db.collection("transactions")

    const budget = await budgets.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    })

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    // Calculate current spending for this budget period
    const startDate = new Date(budget.startDate)
    const endDate = new Date(budget.endDate)

    const query: any = {
      userId: session.user.id,
      type: "expense",
      date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
    }

    if (budget.categoryId) {
      query.categoryId = budget.categoryId
    }

    if (budget.walletId) {
      query.walletId = budget.walletId
    }

    const expenseTransactions = await transactions.find(query).toArray()
    const spent = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    const remaining = Math.max(0, budget.amount - spent)
    const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

    // Check if budget exceeded
    const isExceeded = spent > budget.amount
    const isNearThreshold = percentageUsed >= (budget.alertThreshold || 80)

    return NextResponse.json({
      ...budget,
      spent,
      remaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      isExceeded,
      isNearThreshold,
      recentTransactions: expenseTransactions.slice(0, 5)
    })
  } catch (error) {
    console.error("Error fetching budget:", error)
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

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = budgetUpdateSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const budgets = db.collection("budgets")

    const budget = await budgets.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    })

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    // If period changed, recalculate start/end dates
    let updateData: any = { ...validatedData }
    
    if (validatedData.period && validatedData.period !== budget.period) {
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
        default:
          startDate = budget.startDate
          endDate = budget.endDate
      }

      updateData.startDate = startDate.toISOString()
      updateData.endDate = endDate.toISOString()
    }

    updateData.updatedAt = new Date()

    const result = await budgets.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update budget" }, { status: 400 })
    }

    const updatedBudget = await budgets.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(updatedBudget)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating budget:", error)
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

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const budgets = db.collection("budgets")

    const result = await budgets.deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Budget deleted successfully",
      deletedId: params.id
    })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}