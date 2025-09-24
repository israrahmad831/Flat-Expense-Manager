"use client""use client""use client""use client""use client"



import { useSession } from "next-auth/react"

import { useRouter } from "next/navigation"

import { useEffect, useState } from "react"import { useSession } from "next-auth/react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"import { useRouter } from "next/navigation"

import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Wallet, PieChart, BarChart3 } from "lucide-react"

import { useEffect, useState } from "react"import { useSession } from "next-auth/react"

interface Wallet {

  _id: stringimport { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

  name: string

  balance: numberimport { Button } from "@/components/ui/button"import { useRouter } from "next/navigation"

  currency: string

  color?: stringimport { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Wallet, PieChart, BarChart3 } from "lucide-react"

  icon?: string

}import { useEffect, useState } from "react"import { useSession } from "next-auth/react"import { useSession } from "next-auth/react"



interface Transaction {interface Wallet {

  _id: string

  title: string  _id: stringimport { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

  amount: number

  type: "income" | "expense" | "transfer"  name: string

  categoryId: string

  walletId: string  balance: numberimport { Button } from "@/components/ui/button"import { useRouter } from "next/navigation"import { useRouter } from "next/navigation"

  date: string

}  currency: string



interface Category {  color?: stringimport { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Wallet, PieChart, BarChart3 } from "lucide-react"

  _id: string

  name: string  icon?: string

  type: "income" | "expense"

  icon: string}import { useEffect, useState } from "react"import { useEffect, useState } from "react"

  color: string

}



interface CategoryTotal {interface Transaction {interface Wallet {

  category: Category

  total: number  _id: string

  count: number

  percentage: number  title: string  _id: stringimport { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

}

  amount: number

export default function AnalyticsPage() {

  const { data: session } = useSession()  type: "income" | "expense" | "transfer"  name: string

  const router = useRouter()

  const [wallets, setWallets] = useState<Wallet[]>([])  categoryId: string

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [categories, setCategories] = useState<Category[]>([])  walletId: string  balance: numberimport { Button } from "@/components/ui/button"import { Button } from "@/components/ui/button"

  const [loading, setLoading] = useState(true)

  const [period, setPeriod] = useState("thisMonth")  toWalletId?: string



  useEffect(() => {  date: string  currency: string

    if (session) {

      fetchData()}

    }

  }, [session, period])  color?: stringimport { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Wallet, PieChart, BarChart3 } from "lucide-react"import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, Wallet, PieChart, BarChart3 } from "lucide-react"



  const fetchData = async () => {interface Category {

    setLoading(true)

    try {  _id: string  icon?: string

      const [walletsRes, transactionsRes, categoriesRes] = await Promise.all([

        fetch("/api/wallets"),  name: string

        fetch("/api/transactions?limit=1000"),

        fetch("/api/categories")  type: "income" | "expense"}

      ])

  icon: string

      if (walletsRes.ok) {

        const data = await walletsRes.json()  color: string

        setWallets(data.wallets || [])

      }}



      if (transactionsRes.ok) {interface Transaction {interface Wallet {interface Wallet {

        const data = await transactionsRes.json()

        setTransactions(data.transactions || [])interface CategoryTotal {

      }

  category: Category  _id: string

      if (categoriesRes.ok) {

        const data = await categoriesRes.json()  total: number

        setCategories(data.categories || [])

      }  count: number  title: string  _id: string  _id: string

    } catch (error) {

      console.error("Error fetching data:", error)  percentage: number

    } finally {

      setLoading(false)}  amount: number

    }

  }



  // Filter transactions by periodexport default function AnalyticsPage() {  type: "income" | "expense" | "transfer"  name: string  name: string

  const getFilteredTransactions = () => {

    const now = new Date()  const { data: session } = useSession()

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  const router = useRouter()  categoryId: string

    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const startOfYear = new Date(now.getFullYear(), 0, 1)  const [wallets, setWallets] = useState<Wallet[]>([])

    const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const [transactions, setTransactions] = useState<Transaction[]>([])  walletId: string  balance: number  balance: number

    return transactions.filter(transaction => {

      const transactionDate = new Date(transaction.date)  const [categories, setCategories] = useState<Category[]>([])

      

      switch (period) {  const [loading, setLoading] = useState(true)  toWalletId?: string

        case "thisMonth":

          return transactionDate >= startOfMonth  const [period, setPeriod] = useState("thisMonth")

        case "lastMonth":

          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth  date: string  currency: string  currency: string

        case "thisYear":

          return transactionDate >= startOfYear  useEffect(() => {

        case "last3Months":

          return transactionDate >= startOf3MonthsAgo    if (session) {}

        default:

          return true      fetchData()

      }

    })    }  color?: string  color?: string

  }

  }, [session, period])

  const filteredTransactions = getFilteredTransactions()

  interface Category {

  // Calculate totals

  const totalIncome = filteredTransactions  const fetchData = async () => {

    .filter(t => t.type === "income")

    .reduce((sum, t) => sum + t.amount, 0)    setLoading(true)  _id: string  icon?: string  icon?: string



  const totalExpenses = filteredTransactions    try {

    .filter(t => t.type === "expense")

    .reduce((sum, t) => sum + t.amount, 0)      const [walletsRes, transactionsRes, categoriesRes] = await Promise.all([  name: string



  const netIncome = totalIncome - totalExpenses        fetch("/api/wallets"),



  // Category analysis        fetch("/api/transactions?limit=1000"),  type: "income" | "expense"}}

  const getCategoryTotals = (type: "income" | "expense"): CategoryTotal[] => {

    const categoryTotals: { [key: string]: { total: number; count: number; category: Category } } = {}        fetch("/api/categories")

    

    filteredTransactions      ])  icon: string

      .filter(t => t.type === type)

      .forEach(transaction => {

        const category = categories.find(c => c._id === transaction.categoryId)

        if (category) {      if (walletsRes.ok) {  color: string

          if (!categoryTotals[category._id]) {

            categoryTotals[category._id] = { total: 0, count: 0, category }        const data = await walletsRes.json()

          }

          categoryTotals[category._id].total += transaction.amount        setWallets(data.wallets || [])}

          categoryTotals[category._id].count += 1

        }      }

      })

interface Transaction {interface Transaction {

    const total = type === "income" ? totalIncome : totalExpenses

          if (transactionsRes.ok) {

    return Object.values(categoryTotals)

      .map(item => ({        const data = await transactionsRes.json()interface CategoryTotal {

        ...item,

        percentage: total > 0 ? (item.total / total) * 100 : 0        setTransactions(data.transactions || [])

      }))

      .sort((a, b) => b.total - a.total)      }  category: Category  _id: string  _id: string

  }



  const expenseCategories = getCategoryTotals("expense")

  const incomeCategories = getCategoryTotals("income")      if (categoriesRes.ok) {  total: number



  if (loading) {        const data = await categoriesRes.json()

    return (

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">        setCategories(data.categories || [])  count: number  title: string  title: string

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

      </div>      }

    )

  }    } catch (error) {  percentage: number



  return (      console.error("Error fetching data:", error)

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      <div className="container mx-auto px-4 py-8">    } finally {}  amount: number  amount: number

        {/* Header */}

        <div className="flex items-center justify-between mb-8">      setLoading(false)

          <div className="flex items-center gap-4">

            <Button    }

              variant="outline"

              size="sm"  }

              onClick={() => router.back()}

            >export default function AnalyticsPage() {  type: "income" | "expense" | "transfer"  type: "income" | "expense" | "transfer"

              <ArrowLeft className="h-4 w-4" />

            </Button>  // Filter transactions by period

            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>

          </div>  const getFilteredTransactions = () => {  const { data: session } = useSession()



          {/* Period Selector */}    const now = new Date()

          <select

            value={period}    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)  const router = useRouter()  categoryId: string  categoryId: string

            onChange={(e) => setPeriod(e.target.value)}

            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

          >

            <option value="thisMonth">This Month</option>    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)  const [wallets, setWallets] = useState<Wallet[]>([])

            <option value="lastMonth">Last Month</option>

            <option value="last3Months">Last 3 Months</option>    const startOfYear = new Date(now.getFullYear(), 0, 1)

            <option value="thisYear">This Year</option>

          </select>    const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)  const [transactions, setTransactions] = useState<Transaction[]>([])  walletId: string  walletId: string

        </div>



        {/* Overview Cards */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">    return transactions.filter(transaction => {  const [categories, setCategories] = useState<Category[]>([])

          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">      const transactionDate = new Date(transaction.date)

              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>

              <TrendingUp className="h-4 w-4 text-green-600" />        const [loading, setLoading] = useState(true)  toWalletId?: string  toWalletId?: string

            </CardHeader>

            <CardContent>      switch (period) {

              <div className="text-2xl font-bold text-green-600">

                PKR {totalIncome.toLocaleString()}        case "thisMonth":  const [period, setPeriod] = useState("thisMonth")

              </div>

              <p className="text-xs text-gray-600 mt-1">          return transactionDate >= startOfMonth

                {incomeCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions

              </p>        case "lastMonth":  date: string  date: string

            </CardContent>

          </Card>          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth



          <Card>        case "thisYear":  useEffect(() => {

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>          return transactionDate >= startOfYear

              <TrendingDown className="h-4 w-4 text-red-600" />

            </CardHeader>        case "last3Months":    if (session) {}}

            <CardContent>

              <div className="text-2xl font-bold text-red-600">          return transactionDate >= startOf3MonthsAgo

                PKR {totalExpenses.toLocaleString()}

              </div>        default:      fetchData()

              <p className="text-xs text-gray-600 mt-1">

                {expenseCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions          return true

              </p>

            </CardContent>      }    }

          </Card>

    })

          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">  }  }, [session, period])

              <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>

              <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`} />

            </CardHeader>

            <CardContent>  const filteredTransactions = getFilteredTransactions()interface Category {interface Category {

              <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>

                PKR {netIncome.toLocaleString()}  

              </div>

              <p className="text-xs text-gray-600 mt-1">  // Calculate totals  const fetchData = async () => {

                {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}% of income

              </p>  const totalIncome = filteredTransactions

            </CardContent>

          </Card>    .filter(t => t.type === "income")    setLoading(true)  _id: string  _id: string



          <Card>    .reduce((sum, t) => sum + t.amount, 0)

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

              <CardTitle className="text-sm font-medium text-gray-600">Avg. Daily Expense</CardTitle>    try {

              <Calendar className="h-4 w-4 text-blue-600" />

            </CardHeader>  const totalExpenses = filteredTransactions

            <CardContent>

              <div className="text-2xl font-bold text-blue-600">    .filter(t => t.type === "expense")      const [walletsRes, transactionsRes, categoriesRes] = await Promise.all([  name: string  name: string

                PKR {period === "thisMonth" ? Math.round(totalExpenses / new Date().getDate()) : 

                    period === "lastMonth" ? Math.round(totalExpenses / 30) :    .reduce((sum, t) => sum + t.amount, 0)

                    period === "last3Months" ? Math.round(totalExpenses / 90) :

                    Math.round(totalExpenses / 365)}        fetch("/api/wallets"),

              </div>

            </CardContent>  const netIncome = totalIncome - totalExpenses

          </Card>

        </div>        fetch("/api/transactions?limit=1000"),  type: "income" | "expense"  type: "income" | "expense"



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">  // Category analysis

          {/* Expense Categories */}

          <Card>  const getCategoryTotals = (type: "income" | "expense"): CategoryTotal[] => {        fetch("/api/categories")

            <CardHeader>

              <CardTitle className="flex items-center gap-2">    const categoryTotals: { [key: string]: { total: number; count: number; category: Category } } = {}

                <PieChart className="h-5 w-5" />

                Expense Categories          ])  icon: string  icon: string

              </CardTitle>

            </CardHeader>    filteredTransactions

            <CardContent>

              {expenseCategories.length > 0 ? (      .filter(t => t.type === type)

                <div className="space-y-4">

                  {expenseCategories.slice(0, 8).map(({ category, total, count, percentage }) => (      .forEach(transaction => {

                    <div key={category._id} className="flex items-center justify-between">

                      <div className="flex items-center gap-3">        const category = categories.find(c => c._id === transaction.categoryId)      if (walletsRes.ok) {  color: string  color: string

                        <div 

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"        if (category) {

                          style={{ backgroundColor: category.color + "30", color: category.color }}

                        >          if (!categoryTotals[category._id]) {        const data = await walletsRes.json()

                          {category.icon}

                        </div>            categoryTotals[category._id] = { total: 0, count: 0, category }

                        <div>

                          <p className="font-medium text-sm">{category.name}</p>          }        setWallets(data.wallets || [])}}

                          <p className="text-xs text-gray-500">{count} transactions</p>

                        </div>          categoryTotals[category._id].total += transaction.amount

                      </div>

                      <div className="text-right">          categoryTotals[category._id].count += 1      }

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>        }

                      </div>

                    </div>      })

                  ))}

                </div>

              ) : (

                <p className="text-gray-500 text-center py-8">No expense data available</p>    const total = type === "income" ? totalIncome : totalExpenses      if (transactionsRes.ok) {

              )}

            </CardContent>    

          </Card>

    return Object.values(categoryTotals)        const data = await transactionsRes.json()interface CategoryTotal {interface CategoryTotal {

          {/* Income Categories */}

          <Card>      .map(item => ({

            <CardHeader>

              <CardTitle className="flex items-center gap-2">        ...item,        setTransactions(data.transactions || [])

                <BarChart3 className="h-5 w-5" />

                Income Categories        percentage: total > 0 ? (item.total / total) * 100 : 0

              </CardTitle>

            </CardHeader>      }))      }  category: Category  category: Category

            <CardContent>

              {incomeCategories.length > 0 ? (      .sort((a, b) => b.total - a.total)

                <div className="space-y-4">

                  {incomeCategories.slice(0, 8).map(({ category, total, count, percentage }) => (  }

                    <div key={category._id} className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div 

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"  const expenseCategories = getCategoryTotals("expense")      if (categoriesRes.ok) {  total: number  total: number

                          style={{ backgroundColor: category.color + "30", color: category.color }}

                        >  const incomeCategories = getCategoryTotals("income")

                          {category.icon}

                        </div>        const data = await categoriesRes.json()

                        <div>

                          <p className="font-medium text-sm">{category.name}</p>  if (loading) {

                          <p className="text-xs text-gray-500">{count} transactions</p>

                        </div>    return (        setCategories(data.categories || [])  count: number  count: number

                      </div>

                      <div className="text-right">      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>      }

                      </div>

                    </div>      </div>

                  ))}

                </div>    )    } catch (error) {  percentage: number  percentage: number

              ) : (

                <p className="text-gray-500 text-center py-8">No income data available</p>  }

              )}

            </CardContent>      console.error("Error fetching data:", error)

          </Card>

        </div>  return (



        {/* Wallet Performance */}    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">    } finally {}}

        <Card className="mb-8">

          <CardHeader>      <div className="container mx-auto px-4 py-8">

            <CardTitle className="flex items-center gap-2">

              <Wallet className="h-5 w-5" />        {/* Header */}      setLoading(false)

              Wallet Activity ({period})

            </CardTitle>        <div className="flex items-center justify-between mb-8">

          </CardHeader>

          <CardContent>          <div className="flex items-center gap-4">    }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {wallets.map((wallet) => {            <Button

                const walletTransactions = filteredTransactions.filter(t => t.walletId === wallet._id)

                              variant="outline"  }

                const income = walletTransactions

                  .filter(t => t.type === "income")              size="sm"

                  .reduce((sum, t) => sum + t.amount, 0)

                                onClick={() => router.back()}export default function AnalyticsPage() {export default function AnalyticsPage() {

                const expenses = walletTransactions

                  .filter(t => t.type === "expense")            >

                  .reduce((sum, t) => sum + t.amount, 0)

              <ArrowLeft className="h-4 w-4" />  // Filter transactions by period

                const periodBalance = income - expenses

                            </Button>

                return (

                  <div             <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>  const getFilteredTransactions = () => {  const { data: session } = useSession()  const { data: session, status } = useSession()

                    key={wallet._id}

                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"          </div>

                    style={{ borderColor: wallet.color || "#e5e7eb" }}

                  >    const now = new Date()

                    <div className="flex items-center gap-3 mb-3">

                      <span className="text-lg">{wallet.icon || "💰"}</span>          {/* Period Selector */}

                      <div>

                        <h4 className="font-semibold">{wallet.name}</h4>          <select    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)  const router = useRouter()  const router = useRouter()

                        <p className="text-sm text-gray-600">{wallet.currency}</p>

                      </div>            value={period}

                    </div>

                    <div className="space-y-2">            onChange={(e) => setPeriod(e.target.value)}    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

                      <div className="flex justify-between text-sm">

                        <span>Current Balance:</span>            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"

                        <span className="font-semibold">

                          {wallet.currency} {wallet.balance.toLocaleString()}          >    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)  const [wallets, setWallets] = useState<Wallet[]>([])  const [expenses, setExpenses] = useState<Expense[]>([])

                        </span>

                      </div>            <option value="thisMonth">This Month</option>

                      <div className="flex justify-between text-sm">

                        <span>Period Change:</span>            <option value="lastMonth">Last Month</option>    const startOfYear = new Date(now.getFullYear(), 0, 1)

                        <span className={`font-semibold ${periodBalance >= 0 ? "text-green-600" : "text-red-600"}`}>

                          {periodBalance >= 0 ? "+" : ""}{wallet.currency} {periodBalance.toLocaleString()}            <option value="last3Months">Last 3 Months</option>

                        </span>

                      </div>            <option value="thisYear">This Year</option>    const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)  const [transactions, setTransactions] = useState<Transaction[]>([])  const [loading, setLoading] = useState(true)

                      <div className="flex justify-between text-sm text-gray-600">

                        <span>Transactions:</span>          </select>

                        <span>{walletTransactions.length}</span>

                      </div>        </div>

                    </div>

                  </div>

                )

              })}        {/* Overview Cards */}    return transactions.filter(transaction => {  const [categories, setCategories] = useState<Category[]>([])  const [timeFilter, setTimeFilter] = useState("thisMonth")

            </div>

          </CardContent>        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        </Card>

      </div>          <Card>      const transactionDate = new Date(transaction.date)

    </div>

  )            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

}
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>        const [loading, setLoading] = useState(true)

              <TrendingUp className="h-4 w-4 text-green-600" />

            </CardHeader>      switch (period) {

            <CardContent>

              <div className="text-2xl font-bold text-green-600">        case "thisMonth":  const [period, setPeriod] = useState("thisMonth") // thisMonth, lastMonth, thisYear, last3Months  useEffect(() => {

                PKR {totalIncome.toLocaleString()}

              </div>          return transactionDate >= startOfMonth

              <p className="text-xs text-gray-600 mt-1">

                {incomeCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions        case "lastMonth":    if (status === "unauthenticated") {

              </p>

            </CardContent>          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth

          </Card>

        case "thisYear":  useEffect(() => {      router.push("/auth/signin")

          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">          return transactionDate >= startOfYear

              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>

              <TrendingDown className="h-4 w-4 text-red-600" />        case "last3Months":    if (session) {    } else if (status === "authenticated") {

            </CardHeader>

            <CardContent>          return transactionDate >= startOf3MonthsAgo

              <div className="text-2xl font-bold text-red-600">

                PKR {totalExpenses.toLocaleString()}        default:      fetchData()      fetchExpenses()

              </div>

              <p className="text-xs text-gray-600 mt-1">          return true

                {expenseCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions

              </p>      }    }    }

            </CardContent>

          </Card>    })



          <Card>  }  }, [session, period])  }, [status, router])

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

              <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>

              <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`} />

            </CardHeader>  const filteredTransactions = getFilteredTransactions()

            <CardContent>

              <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>  

                PKR {netIncome.toLocaleString()}

              </div>  // Calculate totals  const fetchData = async () => {  const fetchExpenses = async () => {

              <p className="text-xs text-gray-600 mt-1">

                {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}% of income  const totalIncome = filteredTransactions

              </p>

            </CardContent>    .filter(t => t.type === "income")    setLoading(true)    try {

          </Card>

    .reduce((sum, t) => sum + t.amount, 0)

          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">    try {      const response = await fetch("/api/expenses")

              <CardTitle className="text-sm font-medium text-gray-600">Avg. Daily Expense</CardTitle>

              <Calendar className="h-4 w-4 text-blue-600" />  const totalExpenses = filteredTransactions

            </CardHeader>

            <CardContent>    .filter(t => t.type === "expense")      const [walletsRes, transactionsRes, categoriesRes] = await Promise.all([      if (response.ok) {

              <div className="text-2xl font-bold text-blue-600">

                PKR {period === "thisMonth" ? Math.round(totalExpenses / new Date().getDate()) :     .reduce((sum, t) => sum + t.amount, 0)

                    period === "lastMonth" ? Math.round(totalExpenses / 30) :

                    period === "last3Months" ? Math.round(totalExpenses / 90) :        fetch("/api/wallets"),        const data = await response.json()

                    Math.round(totalExpenses / 365)}

              </div>  const netIncome = totalIncome - totalExpenses

            </CardContent>

          </Card>        fetch("/api/transactions?limit=1000"),        setExpenses(data.expenses || [])

        </div>

  // Category analysis

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Expense Categories */}  const getCategoryTotals = (type: "income" | "expense"): CategoryTotal[] => {        fetch("/api/categories")      }

          <Card>

            <CardHeader>    const categoryTotals: { [key: string]: { total: number; count: number; category: Category } } = {}

              <CardTitle className="flex items-center gap-2">

                <PieChart className="h-5 w-5" />          ])    } catch (error) {

                Expense Categories

              </CardTitle>    filteredTransactions

            </CardHeader>

            <CardContent>      .filter(t => t.type === type)      console.error("Failed to fetch expenses:", error)

              {expenseCategories.length > 0 ? (

                <div className="space-y-4">      .forEach(transaction => {

                  {expenseCategories.slice(0, 8).map(({ category, total, count, percentage }) => (

                    <div key={category._id} className="flex items-center justify-between">        const category = categories.find(c => c._id === transaction.categoryId)      if (walletsRes.ok) {    } finally {

                      <div className="flex items-center gap-3">

                        <div         if (category) {

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"

                          style={{ backgroundColor: category.color + "30", color: category.color }}          if (!categoryTotals[category._id]) {        const data = await walletsRes.json()      setLoading(false)

                        >

                          {category.icon}            categoryTotals[category._id] = { total: 0, count: 0, category }

                        </div>

                        <div>          }        setWallets(data.wallets || [])    }

                          <p className="font-medium text-sm">{category.name}</p>

                          <p className="text-xs text-gray-500">{count} transactions</p>          categoryTotals[category._id].total += transaction.amount

                        </div>

                      </div>          categoryTotals[category._id].count += 1      }  }

                      <div className="text-right">

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>        }

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>

                      </div>      })

                    </div>

                  ))}

                </div>

              ) : (    const total = type === "income" ? totalIncome : totalExpenses      if (transactionsRes.ok) {  const getFilteredExpenses = () => {

                <p className="text-gray-500 text-center py-8">No expense data available</p>

              )}    

            </CardContent>

          </Card>    return Object.values(categoryTotals)        const data = await transactionsRes.json()    const now = new Date()



          {/* Income Categories */}      .map(item => ({

          <Card>

            <CardHeader>        ...item,        setTransactions(data.transactions || [])    return expenses.filter(expense => {

              <CardTitle className="flex items-center gap-2">

                <BarChart3 className="h-5 w-5" />        percentage: total > 0 ? (item.total / total) * 100 : 0

                Income Categories

              </CardTitle>      }))      }      const expenseDate = new Date(expense.date)

            </CardHeader>

            <CardContent>      .sort((a, b) => b.total - a.total)

              {incomeCategories.length > 0 ? (

                <div className="space-y-4">  }      

                  {incomeCategories.slice(0, 8).map(({ category, total, count, percentage }) => (

                    <div key={category._id} className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div   const expenseCategories = getCategoryTotals("expense")      if (categoriesRes.ok) {      switch (timeFilter) {

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"

                          style={{ backgroundColor: category.color + "30", color: category.color }}  const incomeCategories = getCategoryTotals("income")

                        >

                          {category.icon}        const data = await categoriesRes.json()        case "thisWeek":

                        </div>

                        <div>  if (loading) {

                          <p className="font-medium text-sm">{category.name}</p>

                          <p className="text-xs text-gray-500">{count} transactions</p>    return (        setCategories(data.categories || [])          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))

                        </div>

                      </div>      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">

                      <div className="text-right">

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>      }          return expenseDate >= weekStart

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>

                      </div>      </div>

                    </div>

                  ))}    )    } catch (error) {        case "thisMonth":

                </div>

              ) : (  }

                <p className="text-gray-500 text-center py-8">No income data available</p>

              )}      console.error("Error fetching data:", error)          return expenseDate.getMonth() === now.getMonth() && 

            </CardContent>

          </Card>  return (

        </div>

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">    } finally {                 expenseDate.getFullYear() === now.getFullYear()

        {/* Wallet Performance */}

        <Card className="mb-8">      <div className="container mx-auto px-4 py-8">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">        {/* Header */}      setLoading(false)        case "lastMonth":

              <Wallet className="h-5 w-5" />

              Wallet Activity ({period})        <div className="flex items-center justify-between mb-8">

            </CardTitle>

          </CardHeader>          <div className="flex items-center gap-4">    }          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

          <CardContent>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">            <Button

              {wallets.map((wallet) => {

                const walletTransactions = filteredTransactions.filter(t =>               variant="outline"  }          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

                  t.walletId === wallet._id || t.toWalletId === wallet._id

                )              size="sm"

                

                const income = walletTransactions              onClick={() => router.back()}          return expenseDate >= lastMonth && expenseDate <= lastMonthEnd

                  .filter(t => t.walletId === wallet._id && t.type === "income")

                  .reduce((sum, t) => sum + t.amount, 0)            >

                  

                const expenses = walletTransactions              <ArrowLeft className="h-4 w-4" />  // Filter transactions by period        case "thisYear":

                  .filter(t => t.walletId === wallet._id && t.type === "expense")

                  .reduce((sum, t) => sum + t.amount, 0)            </Button>

                  

                const transfersIn = walletTransactions            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>  const getFilteredTransactions = () => {          return expenseDate.getFullYear() === now.getFullYear()

                  .filter(t => t.toWalletId === wallet._id && t.type === "transfer")

                  .reduce((sum, t) => sum + t.amount, 0)          </div>

                  

                const transfersOut = walletTransactions    const now = new Date()        default:

                  .filter(t => t.walletId === wallet._id && t.type === "transfer")

                  .reduce((sum, t) => sum + t.amount, 0)          {/* Period Selector */}



                const periodBalance = income + transfersIn - expenses - transfersOut          <select    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)          return true

                

                return (            value={period}

                  <div 

                    key={wallet._id}            onChange={(e) => setPeriod(e.target.value)}    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)      }

                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"

                    style={{ borderColor: wallet.color || "#e5e7eb" }}            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"

                  >

                    <div className="flex items-center gap-3 mb-3">          >    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)    })

                      <span className="text-lg">{wallet.icon || "💰"}</span>

                      <div>            <option value="thisMonth">This Month</option>

                        <h4 className="font-semibold">{wallet.name}</h4>

                        <p className="text-sm text-gray-600">{wallet.currency}</p>            <option value="lastMonth">Last Month</option>    const startOfYear = new Date(now.getFullYear(), 0, 1)  }

                      </div>

                    </div>            <option value="last3Months">Last 3 Months</option>

                    <div className="space-y-2">

                      <div className="flex justify-between text-sm">            <option value="thisYear">This Year</option>    const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

                        <span>Current Balance:</span>

                        <span className="font-semibold">          </select>

                          {wallet.currency} {wallet.balance.toLocaleString()}

                        </span>        </div>  const filteredExpenses = getFilteredExpenses()

                      </div>

                      <div className="flex justify-between text-sm">

                        <span>Period Change:</span>

                        <span className={`font-semibold ${periodBalance >= 0 ? "text-green-600" : "text-red-600"}`}>        {/* Overview Cards */}    return transactions.filter(transaction => {  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

                          {periodBalance >= 0 ? "+" : ""}{wallet.currency} {periodBalance.toLocaleString()}

                        </span>        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

                      </div>

                      <div className="flex justify-between text-sm text-gray-600">          <Card>      const transactionDate = new Date(transaction.date)

                        <span>Transactions:</span>

                        <span>{walletTransactions.length}</span>            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

                      </div>

                    </div>              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>        // Calculate category totals

                  </div>

                )              <TrendingUp className="h-4 w-4 text-green-600" />

              })}

            </div>            </CardHeader>      switch (period) {  const categoryTotals: CategoryTotal[] = Object.entries(

          </CardContent>

        </Card>            <CardContent>

      </div>

    </div>              <div className="text-2xl font-bold text-green-600">        case "thisMonth":    filteredExpenses.reduce((acc, expense) => {

  )

}                PKR {totalIncome.toLocaleString()}

              </div>          return transactionDate >= startOfMonth      acc[expense.category] = (acc[expense.category] || 0) + expense.amount

              <p className="text-xs text-gray-600 mt-1">

                {incomeCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions        case "lastMonth":      return acc

              </p>

            </CardContent>          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth    }, {} as Record<string, number>)

          </Card>

        case "thisYear":  ).map(([category, total]) => ({

          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">          return transactionDate >= startOfYear    category,

              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>

              <TrendingDown className="h-4 w-4 text-red-600" />        case "last3Months":    total,

            </CardHeader>

            <CardContent>          return transactionDate >= startOf3MonthsAgo    count: filteredExpenses.filter(e => e.category === category).length,

              <div className="text-2xl font-bold text-red-600">

                PKR {totalExpenses.toLocaleString()}        default:    percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0

              </div>

              <p className="text-xs text-gray-600 mt-1">          return true  })).sort((a, b) => b.total - a.total)

                {expenseCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions

              </p>      }

            </CardContent>

          </Card>    })  // Calculate monthly trends



          <Card>  }  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

              <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>    const date = new Date()

              <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`} />

            </CardHeader>  const filteredTransactions = getFilteredTransactions()    date.setMonth(date.getMonth() - i)

            <CardContent>

              <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>      const monthExpenses = expenses.filter(expense => {

                PKR {netIncome.toLocaleString()}

              </div>  // Calculate totals      const expenseDate = new Date(expense.date)

              <p className="text-xs text-gray-600 mt-1">

                {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}% of income  const totalIncome = filteredTransactions      return expenseDate.getMonth() === date.getMonth() && 

              </p>

            </CardContent>    .filter(t => t.type === "income")             expenseDate.getFullYear() === date.getFullYear()

          </Card>

    .reduce((sum, t) => sum + t.amount, 0)    })

          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">    return {

              <CardTitle className="text-sm font-medium text-gray-600">Avg. Daily Expense</CardTitle>

              <Calendar className="h-4 w-4 text-blue-600" />  const totalExpenses = filteredTransactions      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),

            </CardHeader>

            <CardContent>    .filter(t => t.type === "expense")      amount: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),

              <div className="text-2xl font-bold text-blue-600">

                PKR {period === "thisMonth" ? (totalExpenses / new Date().getDate()).toFixed(0) :     .reduce((sum, t) => sum + t.amount, 0)      count: monthExpenses.length

                    period === "lastMonth" ? (totalExpenses / 30).toFixed(0) :

                    period === "last3Months" ? (totalExpenses / 90).toFixed(0) :    }

                    (totalExpenses / 365).toFixed(0)}

              </div>  const netIncome = totalIncome - totalExpenses  }).reverse()

            </CardContent>

          </Card>

        </div>

  // Category analysis  const maxMonthlyAmount = Math.max(...monthlyTrends.map(m => m.amount))

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Expense Categories */}  const getCategoryTotals = (type: "income" | "expense"): CategoryTotal[] => {

          <Card>

            <CardHeader>    const categoryTotals: { [key: string]: { total: number; count: number; category: Category } } = {}  if (status === "loading" || loading) {

              <CardTitle className="flex items-center gap-2">

                <PieChart className="h-5 w-5" />        return (

                Expense Categories

              </CardTitle>    filteredTransactions      <div className="min-h-screen flex items-center justify-center bg-gray-50">

            </CardHeader>

            <CardContent>      .filter(t => t.type === type)        <div className="text-center">

              {expenseCategories.length > 0 ? (

                <div className="space-y-4">      .forEach(transaction => {          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>

                  {expenseCategories.slice(0, 8).map(({ category, total, count, percentage }) => (

                    <div key={category._id} className="flex items-center justify-between">        const category = categories.find(c => c._id === transaction.categoryId)          <p className="mt-4 text-lg text-gray-600">Loading analytics...</p>

                      <div className="flex items-center gap-3">

                        <div         if (category) {        </div>

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"

                          style={{ backgroundColor: category.color + "30", color: category.color }}          if (!categoryTotals[category._id]) {      </div>

                        >

                          {category.icon}            categoryTotals[category._id] = { total: 0, count: 0, category }    )

                        </div>

                        <div>          }  }

                          <p className="font-medium text-sm">{category.name}</p>

                          <p className="text-xs text-gray-500">{count} transactions</p>          categoryTotals[category._id].total += transaction.amount

                        </div>

                      </div>          categoryTotals[category._id].count += 1  if (!session) {

                      <div className="text-right">

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>        }    return null

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>

                      </div>      })  }

                    </div>

                  ))}

                </div>

              ) : (    const total = type === "income" ? totalIncome : totalExpenses  return (

                <p className="text-gray-500 text-center py-8">No expense data available</p>

              )}        <div className="min-h-screen bg-gray-50">

            </CardContent>

          </Card>    return Object.values(categoryTotals)      {/* Header */}



          {/* Income Categories */}      .map(item => ({      <header className="bg-white shadow-sm border-b">

          <Card>

            <CardHeader>        ...item,        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              <CardTitle className="flex items-center gap-2">

                <BarChart3 className="h-5 w-5" />        percentage: total > 0 ? (item.total / total) * 100 : 0          <div className="flex items-center justify-between py-4">

                Income Categories

              </CardTitle>      }))            <div className="flex items-center">

            </CardHeader>

            <CardContent>      .sort((a, b) => b.total - a.total)              <Button

              {incomeCategories.length > 0 ? (

                <div className="space-y-4">  }                variant="ghost"

                  {incomeCategories.slice(0, 8).map(({ category, total, count, percentage }) => (

                    <div key={category._id} className="flex items-center justify-between">                onClick={() => router.push("/dashboard")}

                      <div className="flex items-center gap-3">

                        <div   const expenseCategories = getCategoryTotals("expense")                className="mr-4"

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"

                          style={{ backgroundColor: category.color + "30", color: category.color }}  const incomeCategories = getCategoryTotals("income")              >

                        >

                          {category.icon}                <ArrowLeft className="h-4 w-4 mr-2" />

                        </div>

                        <div>  // Wallet balances                Back to Dashboard

                          <p className="font-medium text-sm">{category.name}</p>

                          <p className="text-xs text-gray-500">{count} transactions</p>  const walletBalances = wallets.map(wallet => {              </Button>

                        </div>

                      </div>    const walletTransactions = filteredTransactions.filter(t =>               <h1 className="text-2xl font-bold text-gray-900">

                      <div className="text-right">

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>      t.walletId === wallet._id || t.toWalletId === wallet._id                Analytics & Reports

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>

                      </div>    )              </h1>

                    </div>

                  ))}                </div>

                </div>

              ) : (    const income = walletTransactions            

                <p className="text-gray-500 text-center py-8">No income data available</p>

              )}      .filter(t => t.walletId === wallet._id && t.type === "income")            <div className="flex items-center space-x-4">

            </CardContent>

          </Card>      .reduce((sum, t) => sum + t.amount, 0)              <select

        </div>

                      value={timeFilter}

        {/* Wallet Performance */}

        <Card className="mb-8">    const expenses = walletTransactions                onChange={(e) => setTimeFilter(e.target.value)}

          <CardHeader>

            <CardTitle className="flex items-center gap-2">      .filter(t => t.walletId === wallet._id && t.type === "expense")                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

              <Wallet className="h-5 w-5" />

              Wallet Activity ({period})      .reduce((sum, t) => sum + t.amount, 0)              >

            </CardTitle>

          </CardHeader>                      <option value="thisWeek">This Week</option>

          <CardContent>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">    const transfersIn = walletTransactions                <option value="thisMonth">This Month</option>

              {wallets.map((wallet) => {

                const walletTransactions = filteredTransactions.filter(t =>       .filter(t => t.toWalletId === wallet._id && t.type === "transfer")                <option value="lastMonth">Last Month</option>

                  t.walletId === wallet._id || t.toWalletId === wallet._id

                )      .reduce((sum, t) => sum + t.amount, 0)                <option value="thisYear">This Year</option>

                

                const income = walletTransactions                      <option value="all">All Time</option>

                  .filter(t => t.walletId === wallet._id && t.type === "income")

                  .reduce((sum, t) => sum + t.amount, 0)    const transfersOut = walletTransactions              </select>

                  

                const expenses = walletTransactions      .filter(t => t.walletId === wallet._id && t.type === "transfer")            </div>

                  .filter(t => t.walletId === wallet._id && t.type === "expense")

                  .reduce((sum, t) => sum + t.amount, 0)      .reduce((sum, t) => sum + t.amount, 0)          </div>

                  

                const transfersIn = walletTransactions        </div>

                  .filter(t => t.toWalletId === wallet._id && t.type === "transfer")

                  .reduce((sum, t) => sum + t.amount, 0)    return {      </header>

                  

                const transfersOut = walletTransactions      wallet,

                  .filter(t => t.walletId === wallet._id && t.type === "transfer")

                  .reduce((sum, t) => sum + t.amount, 0)      periodBalance: income + transfersIn - expenses - transfersOut,      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">



                const periodBalance = income + transfersIn - expenses - transfersOut      transactionCount: walletTransactions.length        <div className="px-4 py-6 sm:px-0 space-y-6">

                

                return (    }          {/* Summary Cards */}

                  <div 

                    key={wallet._id}  })          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"

                    style={{ borderColor: wallet.color || "#e5e7eb" }}            <Card>

                  >

                    <div className="flex items-center gap-3 mb-3">  if (loading) {              <CardContent className="p-6">

                      <span className="text-lg">{wallet.icon || "💰"}</span>

                      <div>    return (                <div className="flex items-center">

                        <h4 className="font-semibold">{wallet.name}</h4>

                        <p className="text-sm text-gray-600">{wallet.currency}</p>      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">                  <TrendingUp className="h-8 w-8 text-blue-500" />

                      </div>

                    </div>        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>                  <div className="ml-4">

                    <div className="space-y-2">

                      <div className="flex justify-between text-sm">      </div>                    <p className="text-sm font-medium text-gray-600">Total Spent</p>

                        <span>Current Balance:</span>

                        <span className="font-semibold">    )                    <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>

                          {wallet.currency} {wallet.balance.toLocaleString()}

                        </span>  }                  </div>

                      </div>

                      <div className="flex justify-between text-sm">                </div>

                        <span>Period Change:</span>

                        <span className={`font-semibold ${periodBalance >= 0 ? "text-green-600" : "text-red-600"}`}>  return (              </CardContent>

                          {periodBalance >= 0 ? "+" : ""}{wallet.currency} {periodBalance.toLocaleString()}

                        </span>    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">            </Card>

                      </div>

                      <div className="flex justify-between text-sm text-gray-600">      <div className="container mx-auto px-4 py-8">

                        <span>Transactions:</span>

                        <span>{walletTransactions.length}</span>        {/* Header */}            <Card>

                      </div>

                    </div>        <div className="flex items-center justify-between mb-8">              <CardContent className="p-6">

                  </div>

                )          <div className="flex items-center gap-4">                <div className="flex items-center">

              })}

            </div>            <Button                  <PieChart className="h-8 w-8 text-green-500" />

          </CardContent>

        </Card>              variant="outline"                  <div className="ml-4">

      </div>

    </div>              size="sm"                    <p className="text-sm font-medium text-gray-600">Transactions</p>

  )

}              onClick={() => router.back()}                    <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>

            >                  </div>

              <ArrowLeft className="h-4 w-4" />                </div>

            </Button>              </CardContent>

            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>            </Card>

          </div>

            <Card>

          {/* Period Selector */}              <CardContent className="p-6">

          <select                <div className="flex items-center">

            value={period}                  <Calendar className="h-8 w-8 text-purple-500" />

            onChange={(e) => setPeriod(e.target.value)}                  <div className="ml-4">

            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"                    <p className="text-sm font-medium text-gray-600">Avg per Day</p>

          >                    <p className="text-2xl font-bold text-gray-900">

            <option value="thisMonth">This Month</option>                      ${filteredExpenses.length > 0 ? (totalAmount / Math.max(filteredExpenses.length, 1)).toFixed(2) : '0.00'}

            <option value="lastMonth">Last Month</option>                    </p>

            <option value="last3Months">Last 3 Months</option>                  </div>

            <option value="thisYear">This Year</option>                </div>

          </select>              </CardContent>

        </div>            </Card>



        {/* Overview Cards */}            <Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">              <CardContent className="p-6">

          <Card>                <div className="flex items-center">

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                  <Filter className="h-8 w-8 text-orange-500" />

              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>                  <div className="ml-4">

              <TrendingUp className="h-4 w-4 text-green-600" />                    <p className="text-sm font-medium text-gray-600">Categories</p>

            </CardHeader>                    <p className="text-2xl font-bold text-gray-900">{categoryTotals.length}</p>

            <CardContent>                  </div>

              <div className="text-2xl font-bold text-green-600">                </div>

                PKR {totalIncome.toLocaleString()}              </CardContent>

              </div>            </Card>

              <p className="text-xs text-gray-600 mt-1">          </div>

                {incomeCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions

              </p>          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            </CardContent>            {/* Category Breakdown */}

          </Card>            <Card>

              <CardHeader>

          <Card>                <CardTitle>Spending by Category</CardTitle>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">              </CardHeader>

              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>              <CardContent>

              <TrendingDown className="h-4 w-4 text-red-600" />                {categoryTotals.length === 0 ? (

            </CardHeader>                  <div className="text-center py-8 text-gray-600">

            <CardContent>                    No expenses in selected period

              <div className="text-2xl font-bold text-red-600">                  </div>

                PKR {totalExpenses.toLocaleString()}                ) : (

              </div>                  <div className="space-y-4">

              <p className="text-xs text-gray-600 mt-1">                    {categoryTotals.map((category) => (

                {expenseCategories.reduce((sum, cat) => sum + cat.count, 0)} transactions                      <div key={category.category} className="space-y-2">

              </p>                        <div className="flex justify-between items-center">

            </CardContent>                          <span className="text-sm font-medium text-gray-700">

          </Card>                            {category.category}

                          </span>

          <Card>                          <div className="text-right">

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                            <span className="text-sm font-bold text-gray-900">

              <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>                              ${category.total.toFixed(2)}

              <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`} />                            </span>

            </CardHeader>                            <span className="text-xs text-gray-600 ml-2">

            <CardContent>                              ({category.count} transactions)

              <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>                            </span>

                PKR {netIncome.toLocaleString()}                          </div>

              </div>                        </div>

              <p className="text-xs text-gray-600 mt-1">                        <Progress value={category.percentage} max={100} />

                {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}% of income                        <div className="text-xs text-gray-600">

              </p>                          {category.percentage.toFixed(1)}% of total spending

            </CardContent>                        </div>

          </Card>                      </div>

                    ))}

          <Card>                  </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                )}

              <CardTitle className="text-sm font-medium text-gray-600">Avg. Daily Expense</CardTitle>              </CardContent>

              <Calendar className="h-4 w-4 text-blue-600" />            </Card>

            </CardHeader>

            <CardContent>            {/* Monthly Trends */}

              <div className="text-2xl font-bold text-blue-600">            <Card>

                PKR {period === "thisMonth" ? (totalExpenses / new Date().getDate()).toFixed(0) :               <CardHeader>

                    period === "lastMonth" ? (totalExpenses / 30).toFixed(0) :                <CardTitle>Monthly Trends</CardTitle>

                    period === "last3Months" ? (totalExpenses / 90).toFixed(0) :              </CardHeader>

                    (totalExpenses / new Date().getDay() + 1).toFixed(0)}              <CardContent>

              </div>                <div className="space-y-4">

            </CardContent>                  {monthlyTrends.map((month, index) => (

          </Card>                    <div key={index} className="space-y-2">

        </div>                      <div className="flex justify-between items-center">

                        <span className="text-sm font-medium text-gray-700">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">                          {month.month}

          {/* Expense Categories */}                        </span>

          <Card>                        <div className="text-right">

            <CardHeader>                          <span className="text-sm font-bold text-gray-900">

              <CardTitle className="flex items-center gap-2">                            ${month.amount.toFixed(2)}

                <PieChart className="h-5 w-5" />                          </span>

                Expense Categories                          <span className="text-xs text-gray-600 ml-2">

              </CardTitle>                            ({month.count} transactions)

            </CardHeader>                          </span>

            <CardContent>                        </div>

              {expenseCategories.length > 0 ? (                      </div>

                <div className="space-y-4">                      <Progress 

                  {expenseCategories.slice(0, 8).map(({ category, total, count, percentage }) => (                        value={month.amount} 

                    <div key={category._id} className="flex items-center justify-between">                        max={maxMonthlyAmount || 1}

                      <div className="flex items-center gap-3">                      />

                        <div                     </div>

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"                  ))}

                          style={{ backgroundColor: category.color + "30", color: category.color }}                </div>

                        >              </CardContent>

                          {category.icon}            </Card>

                        </div>          </div>

                        <div>

                          <p className="font-medium text-sm">{category.name}</p>          {/* Recent Activity */}

                          <p className="text-xs text-gray-500">{count} transactions</p>          <Card>

                        </div>            <CardHeader>

                      </div>              <CardTitle>Recent Activity</CardTitle>

                      <div className="text-right">            </CardHeader>

                        <p className="font-semibold">PKR {total.toLocaleString()}</p>            <CardContent>

                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>              {filteredExpenses.length === 0 ? (

                      </div>                <div className="text-center py-8 text-gray-600">

                    </div>                  No recent activity in selected period

                  ))}                </div>

                </div>              ) : (

              ) : (                <div className="space-y-3">

                <p className="text-gray-500 text-center py-8">No expense data available</p>                  {filteredExpenses.slice(0, 10).map((expense) => (

              )}                    <div key={expense._id} className="flex items-center justify-between py-2 border-b border-gray-100">

            </CardContent>                      <div>

          </Card>                        <div className="font-medium text-gray-900">{expense.title}</div>

                        <div className="text-sm text-gray-600">

          {/* Income Categories */}                          {expense.category} • {new Date(expense.date).toLocaleDateString()}

          <Card>                        </div>

            <CardHeader>                      </div>

              <CardTitle className="flex items-center gap-2">                      <div className="text-lg font-bold text-gray-900">

                <BarChart3 className="h-5 w-5" />                        ${expense.amount.toFixed(2)}

                Income Categories                      </div>

              </CardTitle>                    </div>

            </CardHeader>                  ))}

            <CardContent>                </div>

              {incomeCategories.length > 0 ? (              )}

                <div className="space-y-4">            </CardContent>

                  {incomeCategories.slice(0, 8).map(({ category, total, count, percentage }) => (          </Card>

                    <div key={category._id} className="flex items-center justify-between">        </div>

                      <div className="flex items-center gap-3">      </main>

                        <div     </div>

                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"  )

                          style={{ backgroundColor: category.color + "30", color: category.color }}}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{category.name}</p>
                          <p className="text-xs text-gray-500">{count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">PKR {total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No income data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wallet Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {walletBalances.map(({ wallet, periodBalance, transactionCount }) => (
                <div 
                  key={wallet._id}
                  className="p-4 border border-gray-200 rounded-lg"
                  style={{ borderColor: wallet.color }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{wallet.icon || "💰"}</span>
                    <div>
                      <h4 className="font-semibold">{wallet.name}</h4>
                      <p className="text-sm text-gray-600">{wallet.currency}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Period Balance:</span>
                      <span className={`font-semibold ${periodBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {wallet.currency} {periodBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Transactions:</span>
                      <span>{transactionCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}