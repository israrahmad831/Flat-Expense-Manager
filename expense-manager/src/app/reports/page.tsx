"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, BarChart3 } from "lucide-react"

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf'
  dateRange: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'
  customStartDate?: string
  customEndDate?: string
  includeTransactions: boolean
  includeWallets: boolean
  includeBudgets: boolean
  includeTeams: boolean
  walletFilter?: string
  categoryFilter?: string
}

interface Wallet {
  _id: string
  name: string
  currency: string
}

interface Category {
  _id: string
  name: string
  icon: string
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dateRange: 'thisMonth',
    includeTransactions: true,
    includeWallets: true,
    includeBudgets: false,
    includeTeams: false
  })

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }
    
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [walletsRes, categoriesRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch('/api/categories')
      ])
      
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json()
        setWallets(walletsData.wallets || [])
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!exportOptions.includeTransactions && !exportOptions.includeWallets && 
        !exportOptions.includeBudgets && !exportOptions.includeTeams) {
      alert('Please select at least one data type to export')
      return
    }

    try {
      setExporting(true)

      const queryParams = new URLSearchParams({
        format: exportOptions.format,
        dateRange: exportOptions.dateRange,
        includeTransactions: exportOptions.includeTransactions.toString(),
        includeWallets: exportOptions.includeWallets.toString(),
        includeBudgets: exportOptions.includeBudgets.toString(),
        includeTeams: exportOptions.includeTeams.toString()
      })

      if (exportOptions.customStartDate) {
        queryParams.append('startDate', exportOptions.customStartDate)
      }
      if (exportOptions.customEndDate) {
        queryParams.append('endDate', exportOptions.customEndDate)
      }
      if (exportOptions.walletFilter) {
        queryParams.append('walletId', exportOptions.walletFilter)
      }
      if (exportOptions.categoryFilter) {
        queryParams.append('categoryId', exportOptions.categoryFilter)
      }

      const response = await fetch(`/api/export?${queryParams.toString()}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const timestamp = new Date().toISOString().split('T')[0]
        const extension = exportOptions.format === 'pdf' ? 'pdf' : exportOptions.format === 'csv' ? 'csv' : 'json'
        a.download = `expense-report-${timestamp}.${extension}`
        
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Export failed. Please try again.')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const generateQuickReport = async (type: 'monthly' | 'yearly' | 'category') => {
    try {
      setExporting(true)
      
      const response = await fetch(`/api/reports/${type}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Create and download a JSON report
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Quick report error:', error)
      alert('Report generation failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Quick Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => generateQuickReport('monthly')}
                  disabled={exporting}
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Monthly Summary</div>
                    <div className="text-sm text-gray-600">This month's income, expenses, and savings</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => generateQuickReport('yearly')}
                  disabled={exporting}
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Yearly Overview</div>
                    <div className="text-sm text-gray-600">Annual financial summary and trends</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => generateQuickReport('category')}
                  disabled={exporting}
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">Category Analysis</div>
                    <div className="text-sm text-gray-600">Spending breakdown by category</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Custom Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    format: e.target.value as 'json' | 'csv' | 'pdf' 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF (Coming Soon)</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={exportOptions.dateRange}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    dateRange: e.target.value as 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom' 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {exportOptions.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={exportOptions.customStartDate || ''}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        customStartDate: e.target.value 
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={exportOptions.customEndDate || ''}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        customEndDate: e.target.value 
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}

              {/* Data Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include Data
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'includeTransactions', label: 'Transactions' },
                    { key: 'includeWallets', label: 'Wallets' },
                    { key: 'includeBudgets', label: 'Budgets' },
                    { key: 'includeTeams', label: 'Team Expenses' }
                  ].map(option => (
                    <label key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          [option.key]: e.target.checked 
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Wallet (Optional)
                  </label>
                  <select
                    value={exportOptions.walletFilter || ''}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      walletFilter: e.target.value || undefined 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Wallets</option>
                    {wallets.map(wallet => (
                      <option key={wallet._id} value={wallet._id}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Category (Optional)
                  </label>
                  <select
                    value={exportOptions.categoryFilter || ''}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      categoryFilter: e.target.value || undefined 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={exporting || exportOptions.format === 'pdf'}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
              
              {exportOptions.format === 'pdf' && (
                <p className="text-xs text-gray-500 text-center">
                  PDF export is coming soon. Please use JSON or CSV for now.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}