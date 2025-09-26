import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface Transaction {
  _id: string
  title: string
  amount: number
  type: "income" | "expense" | "transfer"
  categoryId: string
  walletId: string
  date: string
}

interface TrendAnalysisProps {
  transactions: Transaction[]
  selectedPeriod: 'week' | 'month' | 'year'
}

export function TrendAnalysis({ transactions, selectedPeriod }: TrendAnalysisProps) {
  const getDailyTrends = () => {
    const dailyData = new Map<string, { income: number; expenses: number }>()
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0]
      const current = dailyData.get(date) || { income: 0, expenses: 0 }
      
      if (transaction.type === 'income') {
        current.income += transaction.amount
      } else if (transaction.type === 'expense') {
        current.expenses += transaction.amount
      }
      
      dailyData.set(date, current)
    })

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        ...data,
        net: data.income - data.expenses
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Show last 7 days
  }

  const getAverages = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365
    
    return {
      avgIncome: totalIncome / days,
      avgExpenses: totalExpenses / days,
      avgNet: (totalIncome - totalExpenses) / days
    }
  }

  const dailyTrends = getDailyTrends()
  const averages = getAverages()
  const maxAmount = Math.max(...dailyTrends.map(d => Math.max(d.income, d.expenses, Math.abs(d.net))))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Daily Trends (Last 7 Days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dailyTrends.length > 0 ? (
          <div className="space-y-6">
            {/* Daily Chart */}
            <div className="space-y-3">
              {dailyTrends.map((day) => (
                <div key={day.date} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className={`font-medium ${day.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      PKR {day.net.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-1 h-8 bg-gray-100 rounded">
                    {/* Income Bar */}
                    <div 
                      className="bg-green-500 rounded-l"
                      style={{ 
                        width: `${maxAmount > 0 ? (day.income / maxAmount) * 50 : 0}%` 
                      }}
                      title={`Income: PKR ${day.income.toFixed(2)}`}
                    />
                    
                    {/* Expenses Bar */}
                    <div 
                      className="bg-red-500 rounded-r"
                      style={{ 
                        width: `${maxAmount > 0 ? (day.expenses / maxAmount) * 50 : 0}%` 
                      }}
                      title={`Expenses: PKR ${day.expenses.toFixed(2)}`}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Income: PKR {day.income.toFixed(2)}</span>
                    <span>Expenses: PKR {day.expenses.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Averages */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Daily Averages ({selectedPeriod})</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-green-600">PKR {averages.avgIncome.toFixed(2)}</p>
                  <p className="text-gray-500">Avg Income</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-red-600">PKR {averages.avgExpenses.toFixed(2)}</p>
                  <p className="text-gray-500">Avg Expenses</p>
                </div>
                <div className="text-center">
                  <p className={`font-medium ${averages.avgNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    PKR {averages.avgNet.toFixed(2)}
                  </p>
                  <p className="text-gray-500">Avg Net</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No transaction data available for trend analysis</p>
        )}
      </CardContent>
    </Card>
  )
}