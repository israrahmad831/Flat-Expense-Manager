import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const client = await clientPromise
        const users = client.db().collection("users")
        
        const user = await users.findOne({
          email: credentials.email
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile: any }) {
      if (account?.provider === "google") {
        const client = await clientPromise
        const users = client.db().collection("users")
        
        // Check if user already exists
        const existingUser = await users.findOne({ email: user.email })
        
        if (existingUser) {
          // If user has password (signed up with email), link the Google account
          if (existingUser.password) {
            await users.updateOne(
              { email: user.email },
              { 
                $set: { 
                  googleId: profile?.sub,
                  image: user.image,
                  updatedAt: new Date()
                }
              }
            )
            return true // Allow signin - accounts are now linked
          }
          // User already exists via Google, just sign in
          return true
        } else {
          // New Google user - create account
          await users.insertOne({
            name: user.name,
            email: user.email,
            image: user.image,
            googleId: profile?.sub,
            createdAt: new Date(),
          })
          return true
        }
      }
      return true
    },
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      if (user) {
        // For Google OAuth, we need to get the user ID from database
        if (account?.provider === "google") {
          const client = await clientPromise
          const users = client.db().collection("users")
          const dbUser = await users.findOne({ email: user.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
          }
        } else {
          token.id = user.id
        }
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If callback URL is provided (like /dashboard), use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Default redirect to dashboard after successful auth
      return `${baseUrl}/dashboard`
    }
  }
}