import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PieChart } from "lucide-react"

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
  icon: string
  color: string
}

interface CategoryTotal {
  category: Category
  total: number
  percentage: number
}

interface CategoryBreakdownProps {
  transactions: Transaction[]
  categories: Category[]
}

export function CategoryBreakdown({ transactions, categories }: CategoryBreakdownProps) {
  const calculateCategoryTotals = (): CategoryTotal[] => {
    const categoryMap = new Map<string, number>()
    let totalExpenses = 0

    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        totalExpenses += transaction.amount
        const current = categoryMap.get(transaction.categoryId) || 0
        categoryMap.set(transaction.categoryId, current + transaction.amount)
      }
    })

    const totals: CategoryTotal[] = []
    categoryMap.forEach((total, categoryId) => {
      const category = categories.find(c => c._id === categoryId)
      if (category) {
        totals.push({
          category,
          total,
          percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
        })
      }
    })

    return totals.sort((a, b) => b.total - a.total)
  }

  const categoryTotals = calculateCategoryTotals()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="w-5 h-5" />
          <span>Expense Breakdown by Category</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoryTotals.length > 0 ? (
          <div className="space-y-4">
            {categoryTotals.map((item) => (
              <div key={item.category._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.category.icon}</span>
                  <div>
                    <p className="font-medium">{item.category.name}</p>
                    <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">PKR {item.total.toFixed(2)}</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No expense data available for this period</p>
        )}
      </CardContent>
    </Card>
  )
}