"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, User, Mail, Shield, Bell } from "lucide-react"

// Password Management Component
function PasswordManagement({ session }: { session: any }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [hasPassword, setHasPassword] = useState(true) // Will be updated based on user data

  useEffect(() => {
    // Check if user has a password (if they signed up with Google only, they won't have one)
    const checkUserPassword = async () => {
      try {
        const response = await fetch('/api/auth/check-password')
        const data = await response.json()
        setHasPassword(data.hasPassword)
      } catch (error) {
        console.error('Error checking password status:', error)
      }
    }
    
    if (session?.user?.email) {
      checkUserPassword()
    }
  }, [session])

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage("Passwords don't match")
      return
    }
    
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch('/api/auth/add-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Password added successfully! You can now sign in with email and password.")
        setHasPassword(true)
        setShowPasswordForm(false)
        setPassword("")
        setConfirmPassword("")
      } else {
        setMessage(data.error || "Failed to add password")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-2">Login Methods</h4>
      {!hasPassword ? (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              Your account was created with Google. Add a password to enable email/password login.
            </p>
          </div>
          
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Add Password
            </Button>
          ) : (
            <form onSubmit={handleAddPassword} className="space-y-3">
              <Input
                type="password"
                placeholder="New password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Adding..." : "Add Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPassword("")
                    setConfirmPassword("")
                    setMessage("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
          {message && (
            <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">
            ✓ You can sign in with both email/password and Google
          </p>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [success] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Profile & Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800">{success}</div>
            </div>
          )}

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={session.user?.name || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={session.user?.email || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>


            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive notifications about new expenses and updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Summary</h4>
                  <p className="text-sm text-gray-600">
                    Get a weekly summary of your expenses
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Budget Alerts</h4>
                  <p className="text-sm text-gray-600">
                    Get notified when approaching budget limits
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Data Protection</h4>
                <p className="text-sm text-blue-800">
                  Your expense data is encrypted and stored securely. We never share your personal information with third parties.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Connected Accounts</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{session.user?.email}</span>
                  <span className="text-green-600">• Connected</span>
                </div>
              </div>

              <PasswordManagement session={session} />

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                      // Implement account deletion
                      alert("Account deletion feature coming soon")
                    }
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Version</h4>
                  <p>1.0.0</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                  <p>September 2025</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Support</h4>
                  <p>support@expensemanager.com</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Privacy Policy</h4>
                  <Button variant="ghost" className="p-0 h-auto text-blue-600">
                    View Privacy Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}