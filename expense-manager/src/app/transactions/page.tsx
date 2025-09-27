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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-white/90 backdrop-blur-sm border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 text-gray-800 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                All Transactions
              </h1>
              <p className="text-gray-600 text-sm">Manage your financial records</p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/transactions/add")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
          >
            Add Transaction
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-50/90 to-green-50/90 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-emerald-100 p-2.5 rounded-xl">
                  <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-700">Total Income</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {totalsByType.income.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50/90 to-red-50/90 border-rose-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-rose-100 p-2.5 rounded-xl">
                  <ArrowDownCircle className="h-5 w-5 text-rose-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-rose-700">Total Expenses</p>
                  <p className="text-2xl font-bold text-rose-800">
                    {totalsByType.expense.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-700">Net Balance</p>
                  <p className={`text-2xl font-bold ${
                    totalsByType.income - totalsByType.expense >= 0 ? "text-emerald-800" : "text-rose-800"
                  }`}>
                    {(totalsByType.income - totalsByType.expense).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Filters & Search</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 h-10 bg-white/90 backdrop-blur-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-700"
                />
              </div>
              
              <select
                className="h-10 px-3 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-gray-900 shadow-sm"
                value={filters.walletId}
                onChange={(e) => setFilters(prev => ({ ...prev, walletId: e.target.value }))}
              >
                <option value="" className="text-gray-500">All Wallets</option>
                {wallets.map(wallet => (
                  <option key={wallet._id} value={wallet._id}>
                    {wallet.icon} {wallet.name}
                  </option>
                ))}
              </select>
              
              <select
                className="h-10 px-3 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-gray-900 shadow-sm"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="" className="text-gray-500">All Types</option>
                <option value="income">💰 Income</option>
                <option value="expense">💸 Expense</option>
                <option value="transfer">🔄 Transfer</option>
              </select>
              
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                placeholder="Start Date"
                className="h-10 bg-white/90 backdrop-blur-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
              />
              
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                placeholder="End Date"
                className="h-10 bg-white/90 backdrop-blur-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Transactions ({filteredTransactions.length} of {pagination.total})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const wallet = getWalletById(transaction.walletId)
                  const toWallet = transaction.toWalletId ? getWalletById(transaction.toWalletId) : null
                  const category = getCategoryById(transaction.categoryId)
                  
                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                          transaction.type === "income" ? "bg-gradient-to-br from-emerald-100 to-green-100" :
                          transaction.type === "expense" ? "bg-gradient-to-br from-rose-100 to-red-100" :
                          "bg-gradient-to-br from-blue-100 to-indigo-100"
                        }`}>
                          {transaction.type === "transfer" ? (
                            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                          ) : transaction.type === "income" ? (
                            <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <ArrowDownCircle className="h-5 w-5 text-rose-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{transaction.title}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === "income" ? "bg-emerald-100 text-emerald-800" :
                              transaction.type === "expense" ? "bg-rose-100 text-rose-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {transaction.type}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span>{wallet?.icon}</span>
                              <span className="font-medium">{wallet?.name}</span>
                            </span>
                            {transaction.type === "transfer" && toWallet && (
                              <>
                                <ArrowLeftRight className="h-3 w-3 text-gray-400" />
                                <span className="flex items-center gap-1">
                                  <span>{toWallet.icon}</span>
                                  <span className="font-medium">{toWallet.name}</span>
                                </span>
                              </>
                            )}
                            {category && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <span>{category.icon} {category.name}</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            {transaction.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">{transaction.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            transaction.type === "income" ? "text-emerald-600" : 
                            transaction.type === "expense" ? "text-rose-600" : "text-blue-600"
                          }`}>
                            {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                            {wallet?.currency && `${wallet.currency} `}{transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-white/80 border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-white/80 border-gray-300 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowLeftRight className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or add your first transaction to get started
                </p>
                <Button 
                  onClick={() => router.push("/transactions/add")}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                >
                  Add Your First Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="bg-white/90 backdrop-blur-sm border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Previous
            </Button>
            <div className="bg-white/90 backdrop-blur-sm border border-gray-300 px-4 py-2 rounded-md shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
            </div>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="bg-white/90 backdrop-blur-sm border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}