"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, TrendingUp, PieChart, Calendar, Filter } from "lucide-react"

interface Expense {
  _id: string
  title: string
  amount: number
  category: string
  date: string
  createdAt: string
}

interface CategoryTotal {
  category: string
  total: number
  count: number
  percentage: number
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("thisMonth")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchExpenses()
    }
  }, [status, router])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses")
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredExpenses = () => {
    const now = new Date()
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      
      switch (timeFilter) {
        case "thisWeek":
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
          return expenseDate >= weekStart
        case "thisMonth":
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear()
        case "lastMonth":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
          return expenseDate >= lastMonth && expenseDate <= lastMonthEnd
        case "thisYear":
          return expenseDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  const filteredExpenses = getFilteredExpenses()
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate category totals
  const categoryTotals: CategoryTotal[] = Object.entries(
    filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([category, total]) => ({
    category,
    total,
    count: filteredExpenses.filter(e => e.category === category).length,
    percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0
  })).sort((a, b) => b.total - a.total)

  // Calculate monthly trends
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === date.getMonth() && 
             expenseDate.getFullYear() === date.getFullYear()
    })
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: monthExpenses.length
    }
  }).reverse()

  const maxMonthlyAmount = Math.max(...monthlyTrends.map(m => m.amount))

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading analytics...</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics & Reports
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <PieChart className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg per Day</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${filteredExpenses.length > 0 ? (totalAmount / Math.max(filteredExpenses.length, 1)).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Filter className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{categoryTotals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryTotals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No expenses in selected period
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryTotals.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {category.category}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">
                              ${category.total.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({category.count} transactions)
                            </span>
                          </div>
                        </div>
                        <Progress value={category.percentage} max={100} />
                        <div className="text-xs text-gray-500">
                          {category.percentage.toFixed(1)}% of total spending
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrends.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {month.month}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            ${month.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({month.count} transactions)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={month.amount} 
                        max={maxMonthlyAmount || 1}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity in selected period
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.slice(0, 10).map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">{expense.title}</div>
                        <div className="text-sm text-gray-500">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}