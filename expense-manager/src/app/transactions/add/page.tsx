"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from "lucide-react"

interface Wallet {
  _id: string
  name: string
  balance: number
  currency: string
  isDefault?: boolean
  color?: string
  icon?: string
}

interface Category {
  _id: string
  name: string
  type: "income" | "expense"
  icon: string
  color: string
}

export default function AddTransaction() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams?.get("type") || "expense"
  
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [transaction, setTransaction] = useState({
    title: "",
    amount: "",
    type: type as "income" | "expense" | "transfer",
    categoryId: "",
    walletId: "",
    toWalletId: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  })

  useEffect(() => {
    fetchWallets()
    fetchCategories()
  }, [])

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallets")
      if (response.ok) {
        const data = await response.json()
        setWallets(data.wallets || [])
        // Set default wallet
        const defaultWallet = data.wallets.find((w: Wallet) => w.isDefault) || data.wallets[0]
        if (defaultWallet) {
          setTransaction(prev => ({ ...prev, walletId: defaultWallet._id }))
        }
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
        // Set default category for the type
        const defaultCategory = data.categories.find((c: Category) => c.type === type)
        if (defaultCategory) {
          setTransaction(prev => ({ ...prev, categoryId: defaultCategory._id }))
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transaction,
          amount: parseFloat(transaction.amount),
          date: new Date(transaction.date + "T12:00:00").toISOString()
        })
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add transaction")
      }
    } catch (error) {
      console.error("Error adding transaction:", error)
      alert("Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === transaction.type)

  const getTypeInfo = () => {
    switch (transaction.type) {
      case "income":
        return {
          title: "Add Income",
          icon: ArrowUpCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          buttonColor: "bg-green-600 hover:bg-green-700"
        }
      case "expense":
        return {
          title: "Add Expense", 
          icon: ArrowDownCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          buttonColor: "bg-red-600 hover:bg-red-700"
        }
      case "transfer":
        return {
          title: "Transfer Money",
          icon: ArrowLeftRight,
          color: "text-blue-600", 
          bgColor: "bg-blue-50",
          buttonColor: "bg-blue-600 hover:bg-blue-700"
        }
    }
  }

  const typeInfo = getTypeInfo()
  const TypeIcon = typeInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
              <h1 className="text-2xl font-bold text-gray-900">{typeInfo.title}</h1>
            </div>
          </div>

          {/* Transaction Type Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button
              variant={transaction.type === "income" ? "default" : "outline"}
              onClick={() => setTransaction(prev => ({ ...prev, type: "income" }))}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Income
            </Button>
            <Button
              variant={transaction.type === "expense" ? "default" : "outline"}
              onClick={() => setTransaction(prev => ({ ...prev, type: "expense" }))}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Expense  
            </Button>
            <Button
              variant={transaction.type === "transfer" ? "default" : "outline"}
              onClick={() => setTransaction(prev => ({ ...prev, type: "transfer" }))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transfer
            </Button>
          </div>

          {/* Form */}
          <Card className={typeInfo.bgColor}>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={transaction.title}
                    onChange={(e) => setTransaction(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter transaction title"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transaction.amount}
                    onChange={(e) => setTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Category (not for transfers) */}
                {transaction.type !== "transfer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md"
                      value={transaction.categoryId}
                      onChange={(e) => setTransaction(prev => ({ ...prev, categoryId: e.target.value }))}
                      required
                    >
                      <option value="">Select Category</option>
                      {filteredCategories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* From Wallet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {transaction.type === "transfer" ? "From Wallet" : "Wallet"}
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md"
                    value={transaction.walletId}
                    onChange={(e) => setTransaction(prev => ({ ...prev, walletId: e.target.value }))}
                    required
                  >
                    <option value="">Select Wallet</option>
                    {wallets.map(wallet => (
                      <option key={wallet._id} value={wallet._id}>
                        {wallet.icon} {wallet.name} - {wallet.currency} {wallet.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Wallet (for transfers) */}
                {transaction.type === "transfer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Wallet
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md"
                      value={transaction.toWalletId}
                      onChange={(e) => setTransaction(prev => ({ ...prev, toWalletId: e.target.value }))}
                      required
                    >
                      <option value="">Select Destination Wallet</option>
                      {wallets
                        .filter(wallet => wallet._id !== transaction.walletId)
                        .map(wallet => (
                        <option key={wallet._id} value={wallet._id}>
                          {wallet.icon} {wallet.name} - {wallet.currency} {wallet.balance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={transaction.date}
                    onChange={(e) => setTransaction(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md"
                    rows={3}
                    value={transaction.description}
                    onChange={(e) => setTransaction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add a note about this transaction..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${typeInfo.buttonColor}`}
                >
                  {loading ? "Adding..." : `Add ${typeInfo.title.split(" ")[1]}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}