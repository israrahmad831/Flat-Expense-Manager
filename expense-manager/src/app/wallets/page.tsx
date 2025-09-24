"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpCircle, ArrowDownCircle, CreditCard, Plus, Wallet, ArrowLeftRight, Users } from "lucide-react"

interface Wallet {
  _id: string
  name: string
  type: string
  balance: number
  currency: string
  isDefault: boolean
}

interface Transaction {
  _id: string
  title: string
  amount: number
  type: "income" | "expense" | "transfer"
  categoryId: string
  walletId: string
  date: string
}

interface Category {
  _id: string
  name: string
  type: "income" | "expense"
  icon: string
  color: string
}

export default function NewDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [newWallet, setNewWallet] = useState({
    name: "",
    type: "cash",
    balance: 0
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchWallets()
      fetchCategories()
    }
  }, [session])

  useEffect(() => {
    if (selectedWallet) {
      fetchTransactions()
    }
  }, [selectedWallet])

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallets")
      if (response.ok) {
        const data = await response.json()
        setWallets(data.wallets || [])
        
        // Set default wallet or first wallet as selected
        const defaultWallet = data.wallets.find((w: Wallet) => w.isDefault) || data.wallets[0]
        if (defaultWallet) {
          setSelectedWallet(defaultWallet)
        }
      }
    } catch (error) {
      console.error("Error fetching wallets:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!selectedWallet) return
    
    try {
      const response = await fetch(`/api/transactions?walletId=${selectedWallet._id}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const createWallet = async () => {
    try {
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWallet)
      })
      
      if (response.ok) {
        setShowCreateWallet(false)
        setNewWallet({ name: "", type: "cash", balance: 0 })
        fetchWallets()
      }
    } catch (error) {
      console.error("Error creating wallet:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) return null

  // If no wallets, show create wallet prompt
  if (wallets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Welcome to Expense Manager!</CardTitle>
            <p className="text-gray-600">Let's start by creating your first wallet</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Wallet Name (e.g., Main Cash)"
              value={newWallet.name}
              onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
            />
            <select 
              className="w-full p-3 border border-gray-300 rounded-md"
              value={newWallet.type}
              onChange={(e) => setNewWallet({...newWallet, type: e.target.value})}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Account</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="other">Other</option>
            </select>
            <Input
              type="number"
              placeholder="Initial Balance (optional)"
              value={newWallet.balance}
              onChange={(e) => setNewWallet({...newWallet, balance: Number(e.target.value)})}
            />
            <Button 
              onClick={createWallet} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!newWallet.name}
            >
              Create Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getCategoryById = (id: string) => categories.find(c => c._id === id)
  
  const currentMonthIncome = transactions
    .filter(t => t.type === "income" && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0)
    
  const currentMonthExpenses = transactions
    .filter(t => t.type === "expense" && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user?.name || "User"}!
            </h1>
            <p className="text-gray-600">
              Manage your expenses across all wallets
            </p>
          </div>
          
          {/* Wallet Selector */}
          <div className="flex items-center gap-3">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              value={selectedWallet?._id || ""}
              onChange={(e) => {
                const wallet = wallets.find(w => w._id === e.target.value)
                setSelectedWallet(wallet || null)
              }}
            >
              {wallets.map(wallet => (
                <option key={wallet._id} value={wallet._id}>
                  {wallet.name} ({wallet.type})
                </option>
              ))}
            </select>
            <Button 
              onClick={() => setShowCreateWallet(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>

        {/* Current Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedWallet?.name} Balance
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                PKR {selectedWallet?.balance?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500">
                Current wallet balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Month Income
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                PKR {currentMonthIncome.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                Income in {selectedWallet?.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Month Expenses
              </CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                PKR {currentMonthExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                Expenses from {selectedWallet?.name}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={() => router.push("/transactions/add?type=income")}
            className="bg-green-600 hover:bg-green-700 h-16"
          >
            <ArrowUpCircle className="h-6 w-6 mr-2" />
            Add Income
          </Button>
          <Button 
            onClick={() => router.push("/transactions/add?type=expense")}
            className="bg-red-600 hover:bg-red-700 h-16"
          >
            <ArrowDownCircle className="h-6 w-6 mr-2" />
            Add Expense
          </Button>
          <Button 
            onClick={() => router.push("/transactions/transfer")}
            className="bg-blue-600 hover:bg-blue-700 h-16"
          >
            <ArrowLeftRight className="h-6 w-6 mr-2" />
            Transfer
          </Button>
          <Button 
            onClick={() => router.push("/teams")}
            className="bg-purple-600 hover:bg-purple-700 h-16"
          >
            <Users className="h-6 w-6 mr-2" />
            Teams
          </Button>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions - {selectedWallet?.name}</CardTitle>
            <Button 
              onClick={() => router.push("/transactions")}
              variant="outline"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => {
                  const category = getCategoryById(transaction.categoryId)
                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                             style={{ backgroundColor: category?.color + "20" }}>
                          <span className="text-lg">{category?.icon || "💰"}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{transaction.title}</h3>
                          <p className="text-sm text-gray-500">{category?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === "income" ? "text-green-600" : 
                          transaction.type === "expense" ? "text-red-600" : "text-blue-600"
                        }`}>
                          {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                          PKR {transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ArrowDownCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions found in {selectedWallet?.name}</p>
                <p className="text-sm">Start by adding your first transaction</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Wallet Modal */}
        {showCreateWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Wallet Name"
                  value={newWallet.name}
                  onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                />
                <select 
                  className="w-full p-3 border border-gray-300 rounded-md"
                  value={newWallet.type}
                  onChange={(e) => setNewWallet({...newWallet, type: e.target.value})}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Account</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="other">Other</option>
                </select>
                <Input
                  type="number"
                  placeholder="Initial Balance"
                  value={newWallet.balance}
                  onChange={(e) => setNewWallet({...newWallet, balance: Number(e.target.value)})}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={createWallet} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!newWallet.name}
                  >
                    Create
                  </Button>
                  <Button 
                    onClick={() => setShowCreateWallet(false)}
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