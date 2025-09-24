import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import { z } from "zod"

const client = new MongoClient(process.env.MONGODB_URI!)

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = signupSchema.parse(body)

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    // Check if user already exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      // Check if user signed up with Google
      if (existingUser.googleId && !existingUser.password) {
        return NextResponse.json(
          { 
            error: "An account with this email already exists via Google. Please sign in with Google instead.", 
            provider: "google" 
          },
          { status: 400 }
        )
      }
      // Check if user signed up with email/password
      if (existingUser.password) {
        return NextResponse.json(
          { 
            error: "An account with this email already exists. Please sign in with your email and password.", 
            provider: "credentials" 
          },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    })

    return NextResponse.json(
      { message: "User created successfully", userId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}