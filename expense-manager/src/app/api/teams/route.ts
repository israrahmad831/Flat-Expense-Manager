import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  currency: z.string().default("PKR")
})

const inviteSchema = z.object({
  email: z.string().email("Valid email is required")
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const teams = db.collection("teams")

    const userTeams = await teams
      .find({
        $or: [
          { createdBy: session.user.id },
          { "members.userId": session.user.id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ teams: userTeams })
  } catch (error) {
    console.error("Get teams error:", error)
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
    const teamData = teamSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const teams = db.collection("teams")

    const team = {
      ...teamData,
      createdBy: session.user.id,
      members: [{
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: "admin",
        joinedAt: new Date()
      }],
      balances: {}, // userId -> { owes: amount, shouldReceive: amount }
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await teams.insertOne(team)

    return NextResponse.json(
      { message: "Team created successfully", teamId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Create team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}