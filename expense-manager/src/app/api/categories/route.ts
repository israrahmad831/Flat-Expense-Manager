import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["income", "expense"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional()
})

// Default categories
const defaultCategories = [
  { name: "Salary", type: "income", icon: "💼", color: "#10B981" },
  { name: "Business", type: "income", icon: "🏢", color: "#059669" },
  { name: "Investment", type: "income", icon: "📈", color: "#0D9488" },
  { name: "Gift", type: "income", icon: "🎁", color: "#8B5CF6" },
  { name: "Other Income", type: "income", icon: "💰", color: "#6366F1" },
  
  { name: "Food & Dining", type: "expense", icon: "🍽️", color: "#EF4444" },
  { name: "Transportation", type: "expense", icon: "🚗", color: "#F97316" },
  { name: "Shopping", type: "expense", icon: "🛍️", color: "#8B5CF6" },
  { name: "Bills & Utilities", type: "expense", icon: "📄", color: "#6B7280" },
  { name: "Health & Medical", type: "expense", icon: "🏥", color: "#EC4899" },
  { name: "Entertainment", type: "expense", icon: "🎮", color: "#3B82F6" },
  { name: "Education", type: "expense", icon: "📚", color: "#06B6D4" },
  { name: "Rent", type: "expense", icon: "🏠", color: "#DC2626" },
  { name: "Groceries", type: "expense", icon: "🛒", color: "#16A34A" },
  { name: "Other Expense", type: "expense", icon: "💸", color: "#6B7280" }
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const categories = db.collection("categories")

    // Check if user has categories
    const userCategories = await categories
      .find({
        $or: [
          { userId: session.user.id },
          { isDefault: true }
        ]
      })
      .sort({ isDefault: -1, name: 1 })
      .toArray()

    // If no categories exist, create default ones
    if (userCategories.length === 0) {
      const defaultCategoriesWithMeta = defaultCategories.map(cat => ({
        ...cat,
        isDefault: true,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      await categories.insertMany(defaultCategoriesWithMeta)
      
      return NextResponse.json({ 
        categories: defaultCategoriesWithMeta,
        message: "Default categories created"
      })
    }

    return NextResponse.json({ categories: userCategories })
  } catch (error) {
    console.error("Get categories error:", error)
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
    const categoryData = categorySchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const categories = db.collection("categories")

    const category = {
      ...categoryData,
      userId: session.user.id,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await categories.insertOne(category)

    return NextResponse.json(
      { message: "Category created successfully", categoryId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}