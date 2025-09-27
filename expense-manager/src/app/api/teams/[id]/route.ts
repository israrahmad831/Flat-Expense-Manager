import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").optional(),
  description: z.string().optional(),
  currency: z.string().optional()
})

const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required")
})

const removeMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required")
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
    const teams = db.collection("teams")

    // Get team details
    const team = await teams.findOne({
      _id: new ObjectId(params.id),
      $or: [
        { createdBy: session.user.id },
        { "members.userId": session.user.id }
      ]
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get team expenses for summary
    const expenses = db.collection("teamExpenses")
    const teamExpenses = await expenses
      .find({ teamId: params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({ 
      team,
      recentExpenses: teamExpenses,
      summary: {
        totalExpenses: teamExpenses.length,
        totalAmount: teamExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      }
    })
  } catch (error) {
    console.error("Get team error:", error)
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
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateTeamSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const teams = db.collection("teams")

    // Check if user is admin of the team
    const team = await teams.findOne({
      _id: new ObjectId(params.id),
      $or: [
        { createdBy: session.user.id },
        { "members": { $elemMatch: { userId: session.user.id, role: "admin" } } }
      ]
    })

    if (!team) {
      return NextResponse.json({ 
        error: "Team not found or insufficient permissions" 
      }, { status: 404 })
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date()
    }

    const result = await teams.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update team" }, { status: 400 })
    }

    const updatedTeam = await teams.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(updatedTeam)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update team error:", error)
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
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const teams = db.collection("teams")

    // Only team creator can delete the team
    const team = await teams.findOne({
      _id: new ObjectId(params.id),
      createdBy: session.user.id
    })

    if (!team) {
      return NextResponse.json({ 
        error: "Team not found or insufficient permissions" 
      }, { status: 404 })
    }

    // Check if team has expenses
    const teamExpenses = db.collection("teamExpenses")
    const expenseCount = await teamExpenses.countDocuments({ teamId: params.id })

    if (expenseCount > 0) {
      return NextResponse.json({
        error: "Cannot delete team with existing expenses",
        expenseCount,
        message: "Please settle all expenses before deleting the team"
      }, { status: 400 })
    }

    // Delete the team
    const result = await teams.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete team" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Team deleted successfully",
      deletedId: params.id
    })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}