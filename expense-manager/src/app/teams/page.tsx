"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Plus, ArrowLeft, UserPlus, Calculator } from "lucide-react"

interface Team {
  _id: string
  name: string
  description: string
  currency: string
  createdBy: string
  members: TeamMember[]
  balances: Record<string, { owes: number; shouldReceive: number }>
  createdAt: string
}

interface TeamMember {
  userId: string
  email: string
  name: string
  role: "admin" | "member"
  joinedAt: string
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    currency: "PKR"
  })

  useEffect(() => {
    if (session) {
      fetchTeams()
    }
  }, [session])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async () => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam)
      })

      if (response.ok) {
        setShowCreateTeam(false)
        setNewTeam({ name: "", description: "", currency: "PKR" })
        fetchTeams()
      }
    } catch (error) {
      console.error("Error creating team:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateTeam(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Teams Grid */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const isAdmin = team.createdBy === (session as any)?.user?.id
              const memberBalance = team.balances[(session as any)?.user?.id || ""]
              
              return (
                <Card key={team._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{team.name}</span>
                      {isAdmin && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{team.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Members */}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      
                      {/* Balance */}
                      {memberBalance && (
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {memberBalance.owes > 0 ? (
                              <span className="text-red-600">
                                You owe: {team.currency} {memberBalance.owes.toLocaleString()}
                              </span>
                            ) : memberBalance.shouldReceive > 0 ? (
                              <span className="text-green-600">
                                You'll receive: {team.currency} {memberBalance.shouldReceive.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-600">All settled up</span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/teams/${team._id}`)}
                          className="flex-1"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/teams/${team._id}/add-expense`)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-6">
              Create a team to start sharing expenses with friends, roommates, or family
            </p>
            <Button
              onClick={() => setShowCreateTeam(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Create New Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name
                  </label>
                  <Input
                    placeholder="e.g., Roommates, Trip to Dubai"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <Input
                    placeholder="Brief description of the team"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-md"
                    value={newTeam.currency}
                    onChange={(e) => setNewTeam({...newTeam, currency: e.target.value})}
                  >
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={createTeam} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={!newTeam.name}
                  >
                    Create Team
                  </Button>
                  <Button 
                    onClick={() => setShowCreateTeam(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}