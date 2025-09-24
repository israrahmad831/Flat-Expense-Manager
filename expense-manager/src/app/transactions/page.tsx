"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Filter, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Edit, Trash2 } from "lucide-react"

interface Wallet {
  _id: string
  name: string
  currency: string
  color?: string
  icon?: string
}

interface Transaction {
  _id: string
  title: string
  amount: number
  type: "income" | "expense" | "transfer"
  categoryId: string
  walletId: string
  toWalletId?: string
  date: string
  description?: string
}

interface Category {
  _id: string
  name: string
  type: "income" | "expense"
  icon: string
  color: string
}

export default function TransactionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    walletId: "",
    type: "",
    search: "",
    startDate: "",
    endDate: ""
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (session) {
      fetchWallets()
      fetchCategories()
      fetchTransactions()
    }
  }, [session, filters, pagination.page])

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallets")
      if (response.ok) {
        const data = await response.json()
        setWallets(data.wallets || [])
      }
    } catch (error) {
      console.error("Error fetching wallets:", error)
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

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.walletId && { walletId: filters.walletId }),
        ...(filters.type && { type: filters.type })
      })

      const response = await fetch(`/api/transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getWalletById = (id: string) => wallets.find(w => w._id === id)
  const getCategoryById = (id: string) => categories.find(c => c._id === id)

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!transaction.title.toLowerCase().includes(searchLower) &&
          !transaction.description?.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    
    if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
      return false
    }
    
    if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
      return false
    }
    
    return true
  })

  const totalsByType = {
    income: filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    expense: filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    transfer: filteredTransactions
      .filter(t => t.type === "transfer")
      .reduce((sum, t) => sum + t.amount, 0)
  }

  if (loading && transactions.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          </div>
          <Button
            onClick={() => router.push("/transactions/add")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Transaction
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                PKR {totalsByType.income.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                PKR {totalsByType.expense.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Balance</CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalsByType.income - totalsByType.expense >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                PKR {(totalsByType.income - totalsByType.expense).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={filters.walletId}
                onChange={(e) => setFilters(prev => ({ ...prev, walletId: e.target.value }))}
              >
                <option value="">All Wallets</option>
                {wallets.map(wallet => (
                  <option key={wallet._id} value={wallet._id}>
                    {wallet.icon} {wallet.name}
                  </option>
                ))}
              </select>
              
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
              
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                placeholder="Start Date"
              />
              
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                placeholder="End Date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transactions ({filteredTransactions.length} of {pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.walletId)
                  const toWallet = transaction.toWalletId ? getWalletById(transaction.toWalletId) : null
                  const category = getCategoryById(transaction.categoryId)
                  
                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                             style={{ backgroundColor: category?.color + "20" || wallet?.color + "20" }}>
                          {transaction.type === "transfer" ? (
                            <ArrowLeftRight className="h-6 w-6 text-blue-600" />
                          ) : (
                            <span className="text-lg">{category?.icon || wallet?.icon || "💰"}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{transaction.title}</h3>
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
                            {transaction.type === "transfer" && toWallet && (
                              <>
                                <ArrowLeftRight className="h-3 w-3" />
                                <span>{toWallet.icon} {toWallet.name}</span>
                              </>
                            )}
                            {category && <span>• {category.name}</span>}
                            <span>• {new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                          
                          {transaction.description && (
                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-semibold text-lg ${
                            transaction.type === "income" ? "text-green-600" : 
                            transaction.type === "expense" ? "text-red-600" : "text-blue-600"
                          }`}>
                            {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                            {wallet?.currency || "PKR"} {transaction.amount.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ArrowLeftRight className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or add your first transaction</p>
                <Button onClick={() => router.push("/transactions/add")}>
                  Add Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}