import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface AnalyticsHeaderProps {
  selectedPeriod: 'week' | 'month' | 'year'
  onPeriodChange: (period: 'week' | 'month' | 'year') => void
  transactions: any[]
  wallets: any[]
  categories: any[]
}

export function AnalyticsHeader({ 
  selectedPeriod, 
  onPeriodChange, 
  transactions, 
  wallets, 
  categories 
}: AnalyticsHeaderProps) {
  
  const exportData = () => {
    const data = {
      transactions,
      wallets,
      categories,
      period: selectedPeriod,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-data-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        onClick={exportData}
        className="flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </Button>
      
      <div className="flex space-x-2">
        {(['week', 'month', 'year'] as const).map(period => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => onPeriodChange(period)}
            className="capitalize"
          >
            {period}
          </Button>
        ))}
      </div>
    </div>
  )
}