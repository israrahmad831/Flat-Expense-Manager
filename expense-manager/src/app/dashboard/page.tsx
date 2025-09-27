"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Wallet,
  ArrowLeftRight,
  Users,
  Settings,
  DollarSign,
  User,
  TrendingUp,
  LogOut,
  List,
  Target,
  Bell,
  FileText,
  ChevronDown,
  BarChart3,
  PieChart,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface Wallet {
  _id: string;
  name: string;
  balance: number;
  currency: string;
  isDefault?: boolean;
  color?: string;
  icon?: string;
  description?: string;
}

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  categoryId: string;
  walletId: string;
  date: string;
}

interface Category {
  _id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // All useState hooks must be declared before any useEffect that uses them
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: "",
    currency: "PKR",
    balance: 0,
    description: "",
    color: "#3B82F6",
    icon: "💰",
  });

  // Save wallet selection to localStorage
  const saveWalletSelection = (wallet: Wallet | null) => {
    if (typeof window !== 'undefined') {
      if (wallet) {
        localStorage.setItem('selectedWallet', JSON.stringify(wallet));
      } else {
        localStorage.setItem('selectedWallet', 'all');
      }
    }
  };

  // Load wallet selection from localStorage
  const loadWalletSelection = (walletsList: Wallet[]) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedWallet');
      if (saved) {
        if (saved === 'all') {
          return null; // All wallets
        } else {
          try {
            const savedWallet = JSON.parse(saved);
            // Find the wallet in the current list by ID to get fresh data
            return walletsList.find(w => w._id === savedWallet._id) || null;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [walletsRes, transactionsRes, categoriesRes] = await Promise.all([
        fetch("/api/wallets"),
        fetch("/api/transactions?limit=20"),
        fetch("/api/categories"),
      ]);

      if (walletsRes.ok) {
        const data = await walletsRes.json();
        const walletsList = data.wallets || [];
        setWallets(walletsList);
        
        if (walletsList.length === 0) {
          // No wallets exist, user must create one
          setShowCreateWallet(true);
        } else {
          // Load saved wallet selection
          const savedWallet = loadWalletSelection(walletsList);
          setSelectedWallet(savedWallet);
        }
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Close wallet selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showWalletSelector && !target.closest(".wallet-selector")) {
        setShowWalletSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showWalletSelector]);

  // Filter transactions when wallet selection changes
  useEffect(() => {
    const filterTransactions = async () => {
      if (!session?.user) return;
      
      try {
        const transactionsRes = await fetch("/api/transactions?limit=20");
        if (transactionsRes.ok) {
          const data = await transactionsRes.json();
          let filteredTransactions = data.transactions || [];
          
          // Filter by selected wallet if one is selected
          if (selectedWallet) {
            filteredTransactions = filteredTransactions.filter(
              (transaction: { wallet: string }) => transaction.wallet === selectedWallet._id
            );
          }
          // If no wallet is selected (All Wallets), show all transactions
          
          setTransactions(filteredTransactions);
        }
      } catch (error) {
        console.error("Error filtering transactions:", error);
      }
    };

    filterTransactions();
  }, [selectedWallet, session?.user]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  // Calculate totals from transactions
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  // Filter transactions by selected wallet if one is selected
  const filteredTransactions = selectedWallet
    ? transactions.filter((t) => t.walletId === selectedWallet._id)
    : transactions;

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = selectedWallet ? selectedWallet.balance : totalBalance;
  const currentCurrency = selectedWallet ? selectedWallet.currency : "";

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-slide-in {
          animation: slideInFromTop 0.2s ease-out forwards;
        }

        .wallet-selector .group:hover {
          transform: translateY(-1px);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl mr-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Expense Manager
                  </h1>
                  <p className="text-sm text-gray-500">
                    Track your finances with ease
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 px-4 py-2 rounded-full">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/analytics")}
                  className="bg-white/50 hover:bg-white/80 text-gray-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  className="bg-white/50 hover:bg-white/80 text-gray-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                <Button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Wallet Selector */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Financial Overview
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedWallet
                      ? `Showing data for ${selectedWallet.name}`
                      : "Showing data for all wallets"}
                  </p>
                </div>

                {wallets.length > 0 && (
                  <div className="relative wallet-selector">
                    <Button
                      onClick={() => setShowWalletSelector(!showWalletSelector)}
                      variant="outline"
                      className={`group relative bg-white hover:bg-gray-50 border ${
                        showWalletSelector
                          ? "border-blue-300 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      } text-gray-700 px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-md min-w-[280px]`}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{
                            backgroundColor:
                              selectedWallet?.color + "20" || "#3B82F620",
                          }}
                        >
                          {selectedWallet?.icon || "🏦"}
                        </div>

                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {selectedWallet
                              ? selectedWallet.name
                              : "All Wallets"}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {selectedWallet
                              ? `${
                                  selectedWallet.currency
                                } ${selectedWallet.balance.toLocaleString()}`
                              : `${wallets.length} wallets combined`}
                          </div>
                        </div>

                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                            showWalletSelector ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </Button>

                    {showWalletSelector && (
                      <div className="absolute top-full mt-3 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-50 animate-in slide-in-from-top-2 duration-300">
                        {/* Header */}
                        <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
                          <h4 className="font-bold text-gray-900 text-sm">
                            Select Wallet
                          </h4>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Choose which wallet to view or see all combined
                          </p>
                        </div>

                        <div className="px-3 py-4 max-h-80 overflow-y-auto">
                          {/* All Wallets Option */}
                          <div
                            onClick={() => {
                              setSelectedWallet(null);
                              saveWalletSelection(null);
                              setShowWalletSelector(false);
                            }}
                            className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                              !selectedWallet
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md"
                                : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-2 border-transparent hover:border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                                  <DollarSign className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    ∑
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900">
                                    All Wallets
                                  </span>
                                  {!selectedWallet && (
                                    <div className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                      Selected
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mt-0.5">
                                  Combined view • {totalBalance.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {wallets.length} wallets •{" "}
                                  {transactions.length} transactions
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Individual Wallets */}
                          <div className="space-y-2">
                            {wallets.map((wallet, index) => (
                              <div
                                key={wallet._id}
                                onClick={() => {
                                  setSelectedWallet(wallet);
                                  saveWalletSelection(wallet);
                                  setShowWalletSelector(false);
                                }}
                                className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                  selectedWallet?._id === wallet._id
                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md"
                                    : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border-2 border-transparent hover:border-gray-200"
                                }`}
                                style={{
                                  animationDelay: `${index * 50}ms`,
                                  animation: "fadeInUp 0.3s ease-out forwards",
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative">
                                      <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg border-2 border-white group-hover:scale-105 transition-transform duration-200"
                                        style={{
                                          backgroundColor: wallet.color + "20",
                                          borderColor: wallet.color + "40",
                                        }}
                                      >
                                        {wallet.icon}
                                      </div>
                                      {wallet.isDefault && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-900">
                                          {wallet.name}
                                        </span>
                                        {selectedWallet?._id === wallet._id && (
                                          <div className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                            Selected
                                          </div>
                                        )}
                                        {wallet.isDefault && (
                                          <div className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                                            Default
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-0.5">
                                        {wallet.description || "No description"}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {
                                          transactions.filter(
                                            (t) => t.walletId === wallet._id
                                          ).length
                                        }{" "}
                                        transactions
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className="font-bold text-lg"
                                      style={{ color: wallet.color }}
                                    >
                                      {wallet.currency}{" "}
                                      {wallet.balance.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Balance
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>
                              Total Balance: {totalBalance.toLocaleString()}
                            </span>
                            <span>
                              {wallets.length} wallet
                              {wallets.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        {selectedWallet
                          ? `${selectedWallet.name} Balance`
                          : "Total Balance"}
                      </p>
                      <p className="text-3xl font-bold">
                        {currentCurrency && `${currentCurrency} `}{currentBalance.toLocaleString()}
                      </p>
                      <p className="text-blue-200 text-xs mt-1">
                        {selectedWallet
                          ? "Current wallet balance"
                          : `Across ${wallets.length} wallet${
                              wallets.length !== 1 ? "s" : ""
                            }`}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white shadow-xl border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        {selectedWallet ? "Wallet Income" : "Total Income"}
                      </p>
                      <p className="text-3xl font-bold">
                        {currentCurrency && `${currentCurrency} `}{totalIncome.toLocaleString()}
                      </p>
                      <p className="text-green-200 text-xs mt-1">
                        {
                          filteredTransactions.filter(
                            (t) => t.type === "income"
                          ).length
                        }{" "}
                        income transactions
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <ArrowUpCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 via-pink-600 to-rose-700 text-white shadow-xl border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">
                        {selectedWallet ? "Wallet Expenses" : "Total Expenses"}
                      </p>
                      <p className="text-3xl font-bold">
                        {currentCurrency && `${currentCurrency} `}{totalExpenses.toLocaleString()}
                      </p>
                      <p className="text-red-200 text-xs mt-1">
                        {
                          filteredTransactions.filter(
                            (t) => t.type === "expense"
                          ).length
                        }{" "}
                        expense transactions
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <ArrowDownCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 text-white shadow-xl border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        {selectedWallet
                          ? "Wallet Transactions"
                          : "All Transactions"}
                      </p>
                      <p className="text-3xl font-bold">
                        {filteredTransactions.length}
                      </p>
                      <p className="text-purple-200 text-xs mt-1">
                        Net: {currentCurrency && `${currentCurrency} `}
                        {(totalIncome - totalExpenses).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-100 border-0 cursor-pointer"
                  onClick={() => router.push("/transactions/add")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700">
                          Add Transaction
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Record income or expense
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-100 border-0 cursor-pointer"
                  onClick={() => router.push("/transactions")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <List className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-green-700">
                          All Transactions
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Browse transaction history
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-violet-100 border-0 cursor-pointer"
                  onClick={() => router.push("/wallets")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-purple-700">
                          Manage Wallets
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Create and edit wallets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-red-100 border-0 cursor-pointer"
                  onClick={() => router.push("/teams")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-orange-700">
                          Team Expenses
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage shared expenses
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-teal-50 to-cyan-100 border-0 cursor-pointer"
                  onClick={() => router.push("/budgets")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-teal-700">
                          Budget Tracking
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Set and monitor budgets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-yellow-100 border-0 cursor-pointer"
                  onClick={() => router.push("/notifications")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <Bell className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-amber-700">
                          Notifications
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          View alerts & updates
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-pink-100 border-0 cursor-pointer"
                  onClick={() => router.push("/reports")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-rose-700">
                          Reports & Export
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Generate reports & export data
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-slate-50 to-gray-100 border-0 cursor-pointer"
                  onClick={() => router.push("/analytics")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-slate-600 to-gray-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <PieChart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-slate-700">
                          Analytics
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          View detailed charts
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Wallets Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Your Wallets
                </h3>
                <Button
                  onClick={() => setShowCreateWallet(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </div>

              {wallets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wallets.map((wallet) => (
                    <Card
                      key={wallet._id}
                      className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 ${
                        selectedWallet?._id === wallet._id
                          ? "ring-2 ring-blue-500 shadow-lg"
                          : "shadow-md"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${wallet.color}15 0%, ${wallet.color}05 100%)`,
                      }}
                      onClick={() => {
                        setSelectedWallet(wallet);
                        saveWalletSelection(wallet);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform"
                              style={{
                                backgroundColor: wallet.color + "20",
                                border: `2px solid ${wallet.color}30`,
                              }}
                            >
                              {wallet.icon || "💰"}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-700">
                                {wallet.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {wallet.description || "No description"}
                              </p>
                            </div>
                          </div>
                          {wallet.isDefault && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className="text-3xl font-bold"
                            style={{ color: wallet.color }}
                          >
                            {wallet.currency} {wallet.balance.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Current Balance
                          </p>
                        </div>

                        {/* Wallet quick stats */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Transactions:{" "}
                              {
                                transactions.filter(
                                  (t) => t.walletId === wallet._id
                                ).length
                              }
                            </span>
                            {selectedWallet?._id === wallet._id && (
                              <span className="text-blue-600 font-semibold">
                                • Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Wallet className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      No wallets yet
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Create your first wallet to start tracking your expenses
                      and managing your finances effectively.
                    </p>
                    <Button
                      onClick={() => setShowCreateWallet(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Wallet
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Recent Transactions
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedWallet
                    ? `Showing transactions for ${selectedWallet.name}`
                    : "Showing transactions from all wallets"}
                </p>
              </div>
              <Button
                onClick={() => router.push("/transactions/add")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>

            {/* Transactions List */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-r from-gray-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ArrowLeftRight className="h-12 w-12 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      No transactions yet
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {selectedWallet
                        ? `No transactions found for ${selectedWallet.name}. Start by adding your first transaction to this wallet.`
                        : "Start by adding your first transaction to begin tracking your finances."}
                    </p>
                    <Button
                      onClick={() => router.push("/transactions/add")}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Transaction
                    </Button>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-3">
                      {filteredTransactions
                        .slice(0, 8)
                        .map((transaction, index) => {
                          const wallet = wallets.find(
                            (w) => w._id === transaction.walletId
                          );
                          const category = categories.find(
                            (c) => c._id === transaction.categoryId
                          );

                          return (
                            <div
                              key={transaction._id}
                              className="group flex items-center justify-between p-5 rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 bg-white/50"
                              style={{
                                animationDelay: `${index * 100}ms`,
                                animation: "fadeInUp 0.5s ease-out forwards",
                              }}
                            >
                              <div className="flex items-center gap-5 flex-1">
                                <div
                                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                  style={{
                                    background: `linear-gradient(135deg, ${
                                      category?.color ||
                                      wallet?.color ||
                                      "#3B82F6"
                                    }20 0%, ${
                                      category?.color ||
                                      wallet?.color ||
                                      "#3B82F6"
                                    }10 100%)`,
                                    border: `2px solid ${
                                      category?.color ||
                                      wallet?.color ||
                                      "#3B82F6"
                                    }30`,
                                  }}
                                >
                                  {transaction.type === "transfer" ? (
                                    <ArrowLeftRight className="h-7 w-7 text-blue-600" />
                                  ) : transaction.type === "income" ? (
                                    <ArrowUpCircle className="h-7 w-7 text-green-600" />
                                  ) : (
                                    <ArrowDownCircle className="h-7 w-7 text-red-600" />
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-gray-700">
                                      {transaction.title}
                                    </h4>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        transaction.type === "income"
                                          ? "bg-green-100 text-green-700"
                                          : transaction.type === "expense"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {transaction.type.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1 font-medium">
                                      <span className="text-lg">
                                        {wallet?.icon || "💰"}
                                      </span>
                                      {wallet?.name || "Unknown Wallet"}
                                    </span>
                                    {category && (
                                      <span className="flex items-center gap-1">
                                        <span>•</span>
                                        <span className="text-lg">
                                          {category.icon}
                                        </span>
                                        {category.name}
                                      </span>
                                    )}
                                    <span>
                                      •{" "}
                                      {new Date(
                                        transaction.date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div
                                  className={`font-bold text-xl ${
                                    transaction.type === "income"
                                      ? "text-green-600"
                                      : transaction.type === "expense"
                                      ? "text-red-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {transaction.type === "income"
                                    ? "+"
                                    : transaction.type === "expense"
                                    ? "-"
                                    : ""}
                                  {wallet?.currency || "PKR"}{" "}
                                  {transaction.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    transaction.date
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="text-center pt-6 mt-6 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/transactions")}
                        className="bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 text-gray-700 shadow-lg"
                      >
                        View All {filteredTransactions.length} Transactions
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Create Wallet Modal */}
        {showCreateWallet && (
          <CreateWalletModal
            onClose={() => setShowCreateWallet(false)}
            onSuccess={() => {
              setShowCreateWallet(false);
              fetchData();
            }}
            newWallet={newWallet}
            setNewWallet={setNewWallet}
          />
        )}
      </div>
    </>
  );
}

// Create Wallet Modal Component
interface WalletData {
  name: string;
  currency: string;
  balance: number;
  description: string;
  color: string;
  icon: string;
}

function CreateWalletModal({
  onClose,
  onSuccess,
  newWallet,
  setNewWallet,
}: {
  onClose: () => void;
  onSuccess: () => void;
  newWallet: WalletData;
  setNewWallet: (wallet: WalletData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const walletIcons = [
    "💰",
    "🏦",
    "💳",
    "🏠",
    "💼",
    "🚗",
    "🎯",
    "💎",
    "🎁",
    "📱",
  ];
  const walletColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWallet),
      });

      if (response.ok) {
        onSuccess();
        setNewWallet({
          name: "",
          currency: "PKR",
          balance: 0,
          description: "",
          color: "#3B82F6",
          icon: "💰",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create wallet");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Create New Wallet
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Set up a new wallet to organize your finances
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Name
              </label>
              <Input
                type="text"
                value={newWallet.name}
                onChange={(e) =>
                  setNewWallet({ ...newWallet, name: e.target.value })
                }
                placeholder="e.g., Savings, Work, Home"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <Input
                type="text"
                value={newWallet.currency}
                onChange={(e) =>
                  setNewWallet({ ...newWallet, currency: e.target.value })
                }
                placeholder="e.g., PKR, USD, EUR"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Balance
              </label>
              <Input
                type="number"
                step="0.01"
                value={newWallet.balance}
                onChange={(e) =>
                  setNewWallet({
                    ...newWallet,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {walletIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewWallet({ ...newWallet, icon })}
                    className={`p-3 text-xl border rounded-lg hover:bg-gray-50 ${
                      newWallet.icon === icon
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {walletColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewWallet({ ...newWallet, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newWallet.color === color
                        ? "border-gray-800"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Input
                type="text"
                value={newWallet.description}
                onChange={(e) =>
                  setNewWallet({ ...newWallet, description: e.target.value })
                }
                placeholder="Purpose of this wallet"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Wallet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
