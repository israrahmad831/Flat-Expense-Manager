"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpCircle, ArrowDownCircle, CreditCard, Plus, Wallet, ArrowLeftRight, Users, Settings, DollarSign, User, TrendingUp, LogOut, List } from "lucide-react"
import { signOut } from "next-auth/react"

interface Wallet {
  _id: string
  name: string
  balance: number
  currency: string
  isDefault?: boolean
  color?: string
  icon?: string
  description?: string
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

export default function Dashboard() {
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
    currency: "PKR",
    balance: 0,
    description: "",
    color: "#3B82F6",
    icon: "💰"
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [walletsRes, transactionsRes, categoriesRes] = await Promise.all([
        fetch("/api/wallets"),
        fetch("/api/transactions?limit=20"),
        fetch("/api/categories")
      ])

      if (walletsRes.ok) {
        const data = await walletsRes.json()
        setWallets(data.wallets || [])
        if (data.wallets?.length > 0 && !selectedWallet) {
          setSelectedWallet(data.wallets[0])
        }
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals from transactions
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
    
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const monthlyExpenses = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const now = new Date()
    return transaction.type === "expense" && 
           transactionDate.getMonth() === now.getMonth() && 
           transactionDate.getFullYear() === now.getFullYear()
  }).reduce((sum, t) => sum + t.amount, 0)

  if (status === "loading" || loading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Expense Manager
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{session.user?.name || session.user?.email}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/analytics")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Balance</p>
                    <p className="text-3xl font-bold">PKR {totalBalance.toLocaleString()}</p>
                  </div>
                  <Wallet className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Income</p>
                    <p className="text-3xl font-bold">PKR {totalIncome.toLocaleString()}</p>
                  </div>
                  <ArrowUpCircle className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                    <p className="text-3xl font-bold">PKR {totalExpenses.toLocaleString()}</p>
                  </div>
                  <ArrowDownCircle className="h-10 w-10 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Transactions</p>
                    <p className="text-3xl font-bold">{transactions.length}</p>
                  </div>
                  <ArrowLeftRight className="h-10 w-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Button 
              onClick={() => router.push("/transactions/add")}
              className="bg-blue-600 hover:bg-blue-700 h-20 text-left justify-start p-6"
            >
              <Plus className="h-6 w-6 mr-3" />
              <div>
                <div className="font-semibold">Add Transaction</div>
                <div className="text-sm opacity-90">Record income or expense</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => router.push("/transactions")}
              variant="outline"
              className="h-20 text-left justify-start p-6"
            >
              <List className="h-6 w-6 mr-3" />
              <div>
                <div className="font-semibold">View All Transactions</div>
                <div className="text-sm text-gray-600">Browse transaction history</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => router.push("/wallets")}
              variant="outline"
              className="h-20 text-left justify-start p-6"
            >
              <Wallet className="h-6 w-6 mr-3" />
              <div>
                <div className="font-semibold">Manage Wallets</div>
                <div className="text-sm text-gray-600">Create and edit wallets</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => router.push("/teams")}
              variant="outline"
              className="h-20 text-left justify-start p-6"
            >
              <Users className="h-6 w-6 mr-3" />
              <div>
                <div className="font-semibold">Team Expenses</div>
                <div className="text-sm text-gray-600">Manage shared expenses</div>
              </div>
            </Button>
          </div>

          {/* Wallets Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Wallets</h2>
              <Button 
                onClick={() => setShowCreateWallet(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Wallet
              </Button>
            </div>

            {wallets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.map((wallet) => (
                  <Card 
                    key={wallet._id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: wallet.color + "20" }}
                          >
                            {wallet.icon || "💰"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{wallet.name}</h3>
                            <p className="text-sm text-gray-600">{wallet.description}</p>
                          </div>
                        </div>
                        {wallet.isDefault && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: wallet.color }}>
                          {wallet.currency} {wallet.balance.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Current Balance</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No wallets yet</h3>
                  <p className="text-gray-600 mb-6">Create your first wallet to start tracking expenses</p>
                  <Button onClick={() => setShowCreateWallet(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Wallet
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
            <Button 
              onClick={() => router.push("/transactions/add")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {/* Transactions List */}
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowLeftRight className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600 mb-6">Start by adding your first transaction</p>
                  <Button onClick={() => router.push("/transactions/add")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {transactions.slice(0, 5).map((transaction) => {
                    const wallet = wallets.find(w => w._id === transaction.walletId)
                    const category = categories.find(c => c._id === transaction.categoryId)
                    
                    return (
                      <div 
                        key={transaction._id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: category?.color + "20" || wallet?.color + "20" }}
                          >
                            {transaction.type === "transfer" ? (
                              <ArrowLeftRight className="h-6 w-6 text-blue-600" />
                            ) : transaction.type === "income" ? (
                              <ArrowUpCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <ArrowDownCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{transaction.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                transaction.type === "income" ? "bg-green-100 text-green-800" :
                                transaction.type === "expense" ? "bg-red-100 text-red-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {transaction.type}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{wallet?.icon} {wallet?.name}</span>
                              {category && <span>• {category.name}</span>}
                              <span>• {new Date(transaction.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-semibold text-lg ${
                            transaction.type === "income" ? "text-green-600" : 
                            transaction.type === "expense" ? "text-red-600" : "text-blue-600"
                          }`}>
                            {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                            {wallet?.currency || "PKR"} {transaction.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => router.push("/transactions")}
                    >
                      View All Transactions
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Wallet Modal */}
      {showCreateWallet && (
        <CreateWalletModal 
          onClose={() => setShowCreateWallet(false)}
          onSuccess={() => {
            setShowCreateWallet(false)
            fetchData()
          }}
          newWallet={newWallet}
          setNewWallet={setNewWallet}
        />
      )}
    </div>
  )
}

// Create Wallet Modal Component
function CreateWalletModal({ 
  onClose, 
  onSuccess, 
  newWallet, 
  setNewWallet 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  newWallet: any;
  setNewWallet: (wallet: any) => void;
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const walletIcons = ["💰", "🏦", "💳", "🏠", "💼", "🚗", "🎯", "💎", "🎁", "📱"]
  const walletColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWallet),
      })

      if (response.ok) {
        onSuccess()
        setNewWallet({
          name: "",
          currency: "PKR",
          balance: 0,
          description: "",
          color: "#3B82F6",
          icon: "💰"
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create wallet")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Name
              </label>
              <Input
                type="text"
                value={newWallet.name}
                onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                placeholder="e.g., Savings, Work, Home"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <Input
                type="text"
                value={newWallet.currency}
                onChange={(e) => setNewWallet({ ...newWallet, currency: e.target.value })}
                placeholder="e.g., PKR, USD, EUR"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Balance
              </label>
              <Input
                type="number"
                step="0.01"
                value={newWallet.balance}
                onChange={(e) => setNewWallet({ ...newWallet, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {walletIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewWallet({ ...newWallet, icon })}
                    className={`p-3 text-xl border rounded-lg hover:bg-gray-50 ${
                      newWallet.icon === icon ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {walletColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewWallet({ ...newWallet, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newWallet.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Input
                type="text"
                value={newWallet.description}
                onChange={(e) => setNewWallet({ ...newWallet, description: e.target.value })}
                placeholder="Purpose of this wallet"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Wallet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}