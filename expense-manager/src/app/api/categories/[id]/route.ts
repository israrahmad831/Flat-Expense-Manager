import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

const categoryUpdateSchema = z.object({
  name: z.string().min(1, "Category name is required").max(50).optional(),
  type: z.enum(["income", "expense"]).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional(),
  icon: z.string().optional(),
  description: z.string().optional()
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
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const categories = db.collection("categories")

    const category = await categories.findOne({
      _id: new ObjectId(params.id),
      $or: [
        { userId: session.user.id },
        { isDefault: true }
      ]
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error fetching category:", error)
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
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = categoryUpdateSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const categories = db.collection("categories")

    // Check if category exists and belongs to user (can't edit default categories)
    const category = await categories.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
      isDefault: { $ne: true }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or cannot be edited" },
        { status: 404 }
      )
    }

    // Check for duplicate name if updating name
    if (validatedData.name && validatedData.name !== category.name) {
      const existingCategory = await categories.findOne({
        userId: session.user.id,
        name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') },
        _id: { $ne: new ObjectId(params.id) }
      })

      if (existingCategory) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date()
    }

    const result = await categories.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update category" }, { status: 400 })
    }

    const updatedCategory = await categories.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating category:", error)
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
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const categories = db.collection("categories")
    const transactions = db.collection("transactions")

    // Check if category exists and belongs to user (can't delete default categories)
    const category = await categories.findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
      isDefault: { $ne: true }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or cannot be deleted" },
        { status: 404 }
      )
    }

    // Check if category is used in any transactions
    const linkedTransactions = await transactions.countDocuments({
      categoryId: params.id
    })

    if (linkedTransactions > 0) {
      return NextResponse.json({
        error: "Cannot delete category with linked transactions",
        linkedTransactions,
        message: "Please reassign or delete all transactions in this category first"
      }, { status: 400 })
    }

    const result = await categories.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Category deleted successfully",
      deletedId: params.id
    })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}