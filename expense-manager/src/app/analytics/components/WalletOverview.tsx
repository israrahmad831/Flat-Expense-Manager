import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface Transaction {
  _id: string
  title: string
  amount: number
  type: "income" | "expense" | "transfer"
  categoryId: string
  walletId: string
  date: string
}

interface WalletType {
  _id: string
  name: string
  balance: number
  currency: string
  color?: string
  icon?: string
}

interface WalletOverviewProps {
  wallets: WalletType[]
  transactions: Transaction[]
}

export function WalletOverview({ wallets, transactions }: WalletOverviewProps) {
  const getWalletActivity = (walletId: string) => {
    const walletTransactions = transactions.filter(t => t.walletId === walletId)
    const income = walletTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expenses = walletTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { income, expenses, total: walletTransactions.length }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Wallet Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {wallets.length > 0 ? (
          <div className="space-y-4">
            {wallets.map((wallet) => {
              const activity = getWalletActivity(wallet._id)
              return (
                <div key={wallet._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{wallet.icon || '💳'}</span>
                      <div>
                        <p className="font-medium">{wallet.name}</p>
                        <p className="text-sm text-gray-500">{wallet.currency}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold" style={{ color: wallet.color }}>
                      {wallet.currency} {wallet.balance.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-green-600">+{wallet.currency} {activity.income.toFixed(2)}</p>
                      <p className="text-gray-500">Income</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-red-600">-{wallet.currency} {activity.expenses.toFixed(2)}</p>
                      <p className="text-gray-500">Expenses</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-600">{activity.total}</p>
                      <p className="text-gray-500">Transactions</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No wallets found</p>
        )}
      </CardContent>
    </Card>
  )
}