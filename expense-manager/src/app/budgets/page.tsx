"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Plus, Target, AlertTriangle, Calendar } from "lucide-react"

interface Budget {
  _id: string
  name: string
  amount: number
  spent: number
  categoryId?: string
  walletId?: string
  period: "monthly" | "weekly" | "yearly"
  startDate: string
  endDate: string
  alertThreshold: number // percentage (e.g., 80 for 80%)
  isActive: boolean
  createdAt: string
}

interface Category {
  _id: string
  name: string
  icon: string
  color: string
}

interface Wallet {
  _id: string
  name: string
  currency: string
  icon?: string
}

export default function BudgetsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateBudget, setShowCreateBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({
    name: "",
    amount: 0,
    categoryId: "",
    walletId: "",
    period: "monthly" as "monthly" | "weekly" | "yearly",
    alertThreshold: 80
  })

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }
    
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [budgetsRes, categoriesRes, walletsRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
        fetch('/api/wallets')
      ])
      
      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json()
        setBudgets(budgetsData.budgets || [])
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.categories || [])
      }
      
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json()
        setWallets(walletsData.wallets || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBudget = async () => {
    if (!newBudget.name || newBudget.amount <= 0) return

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudget)
      })

      if (response.ok) {
        setShowCreateBudget(false)
        setNewBudget({
          name: "",
          amount: 0,
          categoryId: "",
          walletId: "",
          period: "monthly",
          alertThreshold: 80
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const deleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const getProgressColor = (percentage: number, alertThreshold: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= alertThreshold) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (percentage: number, alertThreshold: number) => {
    if (percentage >= 100) return <AlertTriangle className="w-5 h-5 text-red-500" />
    if (percentage >= alertThreshold) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return <Target className="w-5 h-5 text-green-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          </div>
          
          <Button
            onClick={() => setShowCreateBudget(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgets.filter(b => b.isActive).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                PKR {budgets.filter(b => b.isActive).reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                PKR {budgets.filter(b => b.isActive).reduce((sum, b) => sum + b.spent, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {budgets.filter(b => b.isActive && (b.spent / b.amount) * 100 >= b.alertThreshold).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budgets Grid */}
        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100
              const category = categories.find(c => c._id === budget.categoryId)
              const wallet = wallets.find(w => w._id === budget.walletId)
              
              return (
                <Card key={budget._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                        {getStatusIcon(percentage, budget.alertThreshold)}
                        <span>{budget.name}</span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBudget(budget._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Budget Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium">
                          PKR {budget.spent.toFixed(2)} / PKR {budget.amount.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-3"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% used
                        </span>
                        <span className="text-xs text-gray-500">
                          PKR {(budget.amount - budget.spent).toFixed(2)} left
                        </span>
                      </div>
                    </div>

                    {/* Budget Details */}
                    <div className="space-y-2 text-sm">
                      {category && (
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      )}
                      
                      {wallet && (
                        <div className="flex items-center space-x-2">
                          <span>{wallet.icon || '💳'}</span>
                          <span>{wallet.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="capitalize">{budget.period}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-2 border-t">
                      {percentage >= 100 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Over Budget
                        </span>
                      ) : percentage >= budget.alertThreshold ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Alert Threshold
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          On Track
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first budget to start tracking your spending goals
            </p>
            <Button
              onClick={() => setShowCreateBudget(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Budget
            </Button>
          </div>
        )}

        {/* Create Budget Modal */}
        {showCreateBudget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Create New Budget</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateBudget(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Name
                    </label>
                    <Input
                      value={newBudget.name}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly Groceries"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Amount (PKR)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category (Optional)
                    </label>
                    <select
                      value={newBudget.categoryId}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet (Optional)
                    </label>
                    <select
                      value={newBudget.walletId}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, walletId: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">All Wallets</option>
                      {wallets.map(wallet => (
                        <option key={wallet._id} value={wallet._id}>
                          {wallet.icon || '💳'} {wallet.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Period
                    </label>
                    <select
                      value={newBudget.period}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value as "monthly" | "weekly" | "yearly" }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Threshold (%)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={newBudget.alertThreshold}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) || 80 }))}
                      placeholder="80"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified when you reach this percentage of your budget
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateBudget(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createBudget}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Create Budget
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