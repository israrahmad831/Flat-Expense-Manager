import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MongoClient } from "mongodb"
import { z } from "zod"

const client = new MongoClient(process.env.MONGODB_URI!)

const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  splitType: z.enum(["equal", "custom"]).default("equal"),
  participants: z.array(z.string()).min(1, "At least one participant is required"),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await client.connect()
    const db = client.db()
    const expenses = db.collection("expenses")

    const userExpenses = await expenses
      .find({
        $or: [
          { createdBy: session.user.id },
          { participants: session.user.id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ expenses: userExpenses })
  } catch (error) {
    console.error("Get expenses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await client.close()
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const expenseData = expenseSchema.parse(body)

    await client.connect()
    const db = client.db()
    const expenses = db.collection("expenses")

    const expense = {
      ...expenseData,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await expenses.insertOne(expense)

    return NextResponse.json(
      { message: "Expense created successfully", expenseId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await client.close()
  }
}