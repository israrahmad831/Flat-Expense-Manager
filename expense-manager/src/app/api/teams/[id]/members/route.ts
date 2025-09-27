import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["member", "admin"]).default("member")
})

const removeMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required")
})

// Invite member to team
export async function POST(
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
    const { email, role } = inviteMemberSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const teams = db.collection("teams")
    const users = db.collection("users")

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

    // Check if user exists
    const userToInvite = await users.findOne({ email })
    if (!userToInvite) {
      return NextResponse.json({ 
        error: "User with this email not found" 
      }, { status: 404 })
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some((member: any) => 
      member.userId === userToInvite._id.toString()
    )

    if (isAlreadyMember) {
      return NextResponse.json({ 
        error: "User is already a team member" 
      }, { status: 400 })
    }

    // Add member to team
    const newMember = {
      userId: userToInvite._id.toString(),
      email: userToInvite.email,
      name: userToInvite.name || userToInvite.email,
      role,
      joinedAt: new Date()
    }

    const result = await teams.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $push: { "members": newMember } as any,
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to add member" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Member added successfully",
      member: newMember
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Add member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Remove member from team
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

    const { searchParams } = new URL(request.url)
    const userIdToRemove = searchParams.get('userId')

    if (!userIdToRemove) {
      return NextResponse.json({ 
        error: "User ID is required as query parameter" 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const teams = db.collection("teams")

    // Get team first
    const team = await teams.findOne({ _id: new ObjectId(params.id) })
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check permissions - must be admin or removing themselves
    const isAdmin = team.createdBy === session.user.id || 
                   team.members?.some((member: any) => 
                     member.userId === session.user.id && member.role === "admin"
                   )
    
    if (!isAdmin && userIdToRemove !== session.user.id) {
      return NextResponse.json({ 
        error: "Insufficient permissions" 
      }, { status: 403 })
    }

    // Cannot remove team creator
    if (userIdToRemove === team.createdBy) {
      return NextResponse.json({ 
        error: "Cannot remove team creator" 
      }, { status: 400 })
    }

    // Check if member exists in team
    const memberExists = team.members?.some((member: any) => 
      member.userId === userIdToRemove
    )

    if (!memberExists) {
      return NextResponse.json({ 
        error: "User is not a member of this team" 
      }, { status: 400 })
    }

    // Remove member from team
    const result = await teams.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $pull: { "members": { userId: userIdToRemove } } as any,
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to remove member" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: userIdToRemove === session.user.id ? "Left team successfully" : "Member removed successfully",
      removedUserId: userIdToRemove
    })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}