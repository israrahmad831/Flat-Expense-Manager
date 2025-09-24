import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    // Check if user exists
    const existingUser = await users.findOne({ email })

    if (existingUser) {
      // If user has password (email signup), they can link with Google
      if (existingUser.password) {
        return NextResponse.json({
          exists: true,
          canLink: true,
          message: "Account exists with email/password. Signing in with Google will link your accounts."
        })
      }
      // User already signed up with Google
      return NextResponse.json({
        exists: true,
        canLink: false,
        message: "Account already exists with Google. Please sign in."
      })
    }

    // New user - can sign up with Google
    return NextResponse.json({
      exists: false,
      canLink: false,
      message: "New account will be created."
    })

  } catch (error) {
    console.error("Error checking Google account:", error)
    return NextResponse.json(
      { error: "Failed to check account status" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}