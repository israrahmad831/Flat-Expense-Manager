import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import clientPromise from "@/lib/mongodb"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = signupSchema.parse(body)

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    // Check if user already exists
    console.log("Email signup attempt for:", email)
    const existingUser = await users.findOne({ email })
    console.log("Existing user found during signup:", existingUser ? "Yes" : "No")
    
    if (existingUser) {
      console.log("Existing user details:", { 
        hasPassword: !!existingUser.password, 
        hasGoogleId: !!existingUser.googleId 
      })
      
      // If user has both Google and password, they already have a full account
      if (existingUser.password) {
        console.log("User already has password, rejecting signup")
        return NextResponse.json(
          { 
            error: "An account with this email already exists. Please sign in with your email and password.", 
            provider: "credentials" 
          },
          { status: 400 }
        )
      }
      
      // If user only has Google account, add password to existing account
      if (existingUser.googleId && !existingUser.password) {
        console.log("Adding password to existing Google account")
        const hashedPassword = await bcrypt.hash(password, 12)
        
        await users.updateOne(
          { email },
          { 
            $set: { 
              password: hashedPassword,
              name: name || existingUser.name,
              updatedAt: new Date()
            }
          }
        )
        
        return NextResponse.json(
          { 
            message: "Password added to existing Google account successfully. You can now sign in with either method.", 
            userId: existingUser._id 
          },
          { status: 201 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("Creating new email user for:", email)
    // Create new user
    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log("New email user created with ID:", result.insertedId)
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
  }
}