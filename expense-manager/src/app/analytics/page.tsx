"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { SummaryCards } from "./components/SummaryCards";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { WalletOverview } from "./components/WalletOverview";
import { TrendAnalysis } from "./components/TrendAnalysis";

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  categoryId: string;
  walletId: string;
  date: string;
}

interface Wallet {
  _id: string;
  name: string;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
}

interface Category {
  _id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [transactionsRes, walletsRes, categoriesRes] = await Promise.all([
        fetch(`/api/transactions?period=${selectedPeriod}`),
        fetch("/api/wallets"),
        fetch("/api/categories"),
      ]);

      if (transactionsRes.ok) {
        const transactionData = await transactionsRes.json();
        setTransactions(transactionData.transactions || []);
      }

      if (walletsRes.ok) {
        const walletData = await walletsRes.json();
        setWallets(walletData.wallets || []);
      }

      if (categoriesRes.ok) {
        const categoryData = await categoriesRes.json();
        setCategories(categoryData.categories || []);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session, selectedPeriod, fetchData]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to view analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnalyticsHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          transactions={transactions}
          wallets={wallets}
          categories={categories}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <SummaryCards transactions={transactions} wallets={wallets} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CategoryBreakdown
                transactions={transactions}
                categories={categories}
              />

              <TrendAnalysis
                transactions={transactions}
                selectedPeriod={selectedPeriod}
              />
            </div>

            <WalletOverview transactions={transactions} wallets={wallets} />
          </div>
        )}
      </div>
    </div>
  );
}
