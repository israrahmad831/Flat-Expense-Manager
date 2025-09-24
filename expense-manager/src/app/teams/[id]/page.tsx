"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Users, DollarSign, Calculator } from "lucide-react"

interface TeamMember {
  userId: string
  email: string
  name: string
  role: "admin" | "member"
  joinedAt: string
}

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

interface TeamExpense {
  _id: string
  title: string
  amount: number
  description?: string
  paidBy: string
  teamId: string
  splitType: "equal" | "custom" | "percentage"
  splits: Record<string, number> // userId -> amount or percentage
  date: string
  createdAt: string
}

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [expenses, setExpenses] = useState<TeamExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: 0,
    description: "",
    splitType: "equal" as "equal" | "custom" | "percentage",
    customSplits: {} as Record<string, number>
  })

  useEffect(() => {
    if (session) {
      fetchTeamData()
    }
  }, [session, params.id])

  const fetchTeamData = async () => {
    try {
      const [teamRes, expensesRes] = await Promise.all([
        fetch(`/api/teams/${params.id}`),
        fetch(`/api/teams/${params.id}/expenses`)
      ])

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeam(teamData.team)
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData.expenses || [])
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addExpense = async () => {
    if (!team || !newExpense.title || newExpense.amount <= 0) return

    try {
      const splits: Record<string, number> = {}
      
      if (newExpense.splitType === "equal") {
        const splitAmount = newExpense.amount / team.members.length
        team.members.forEach(member => {
          splits[member.userId] = splitAmount
        })
      } else {
        Object.assign(splits, newExpense.customSplits)
      }

      const response = await fetch(`/api/teams/${params.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExpense.title,
          amount: newExpense.amount,
          description: newExpense.description,
          paidBy: (session?.user as any)?.id,
          splitType: newExpense.splitType,
          splits
        })
      })

      if (response.ok) {
        setShowAddExpense(false)
        setNewExpense({
          title: "",
          amount: 0,
          description: "",
          splitType: "equal",
          customSplits: {}
        })
        fetchTeamData()
      }
    } catch (error) {
      console.error("Error adding expense:", error)
    }
  }

  const settleUp = async (withUserId: string) => {
    try {
      const response = await fetch(`/api/teams/${params.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withUserId })
      })

      if (response.ok) {
        fetchTeamData()
      }
    } catch (error) {
      console.error("Error settling up:", error)
    }
  }

  const updateCustomSplit = (userId: string, amount: number) => {
    setNewExpense(prev => ({
      ...prev,
      customSplits: {
        ...prev.customSplits,
        [userId]: amount
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Team not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const currentUserBalance = team.balances[(session?.user as any)?.id || ""]
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">{team.description}</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowAddExpense(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{team.currency} {totalExpenses.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Your Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentUserBalance ? (
                    <div className="text-2xl font-bold">
                      {currentUserBalance.owes > 0 ? (
                        <span className="text-red-600">-{team.currency} {currentUserBalance.owes.toFixed(2)}</span>
                      ) : currentUserBalance.shouldReceive > 0 ? (
                        <span className="text-green-600">+{team.currency} {currentUserBalance.shouldReceive.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-600">Settled</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-600">Settled</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{team.members.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Recent Expenses</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.slice(0, 10).map((expense) => (
                      <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-gray-600">
                            Paid by {team.members.find(m => m.userId === expense.paidBy)?.name || 'Unknown'}
                            {expense.description && ` • ${expense.description}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{team.currency} {expense.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-500 capitalize">{expense.splitType} split</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No expenses yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Balances & Members */}
          <div className="space-y-6">
            {/* Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>Balances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.map((member) => {
                    const balance = team.balances[member.userId]
                    return (
                      <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                        <div className="text-right">
                          {balance && balance.owes > 0 ? (
                            <div>
                              <p className="text-sm font-medium text-red-600">Owes</p>
                              <p className="font-bold text-red-600">{team.currency} {balance.owes.toFixed(2)}</p>
                              {member.userId !== (session?.user as any)?.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-1"
                                  onClick={() => settleUp(member.userId)}
                                >
                                  Settle Up
                                </Button>
                              )}
                            </div>
                          ) : balance && balance.shouldReceive > 0 ? (
                            <div>
                              <p className="text-sm font-medium text-green-600">Gets Back</p>
                              <p className="font-bold text-green-600">{team.currency} {balance.shouldReceive.toFixed(2)}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">Settled</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Members</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Add New Expense</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddExpense(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <Input
                      value={newExpense.title}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Dinner, groceries, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ({team.currency})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <Input
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Split Type
                    </label>
                    <select
                      value={newExpense.splitType}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, splitType: e.target.value as "equal" | "custom" | "percentage" }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="equal">Split Equally</option>
                      <option value="custom">Custom Amounts</option>
                    </select>
                  </div>

                  {newExpense.splitType === "custom" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Split
                      </label>
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between">
                            <span className="text-sm">{member.name}</span>
                            <Input
                              type="number"
                              step="0.01"
                              className="w-24"
                              placeholder="0.00"
                              value={newExpense.customSplits[member.userId] || ""}
                              onChange={(e) => updateCustomSplit(member.userId, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddExpense(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addExpense}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Add Expense
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}