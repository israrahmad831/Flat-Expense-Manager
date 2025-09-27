"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  Wallet as WalletIcon,
  Tag,
  Calendar,
  FileText,
  DollarSign,
  Loader2,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";

interface Wallet {
  _id: string;
  name: string;
  balance: number;
  currency: string;
  isDefault?: boolean;
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

export default function AddTransaction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams?.get("type") || "expense";

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [transaction, setTransaction] = useState({
    title: "",
    amount: "",
    type: type as "income" | "expense" | "transfer",
    categoryId: "",
    walletId: "",
    toWalletId: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  // Load wallet selection from localStorage
  const loadSavedWallet = (walletsList: Wallet[]) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedWallet");
      if (saved && saved !== "all") {
        try {
          const savedWallet = JSON.parse(saved);
          const foundWallet = walletsList.find(
            (w) => w._id === savedWallet._id
          );
          return foundWallet?._id || "";
        } catch {
          return "";
        }
      }
    }
    return "";
  };

  const fetchWallets = useCallback(async () => {
    try {
      const response = await fetch("/api/wallets");
      if (response.ok) {
        const data = await response.json();
        const walletsList = data.wallets || [];
        setWallets(walletsList);

        // Try to use saved wallet, fallback to default or first wallet
        const savedWalletId = loadSavedWallet(walletsList);
        const walletId =
          savedWalletId ||
          walletsList.find((w: Wallet) => w.isDefault)?._id ||
          walletsList[0]?._id ||
          "";

        if (walletId) {
          setTransaction((prev) => ({ ...prev, walletId }));
        }
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
      setError("Failed to load wallets");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        // Set default category for the type
        const defaultCategory = data.categories.find(
          (c: Category) => c.type === type
        );
        if (defaultCategory) {
          setTransaction((prev) => ({
            ...prev,
            categoryId: defaultCategory._id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories");
    }
  }, [type]);

  useEffect(() => {
    fetchWallets();
    fetchCategories();
  }, [fetchWallets, fetchCategories]);

  const validateForm = () => {
    if (!transaction.title.trim()) {
      setError("Please enter a title");
      return false;
    }

    if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (!transaction.walletId) {
      setError("Please select a wallet");
      return false;
    }

    if (transaction.type === "transfer" && !transaction.toWalletId) {
      setError("Please select a destination wallet");
      return false;
    }

    if (transaction.type !== "transfer" && !transaction.categoryId) {
      setError("Please select a category");
      return false;
    }

    if (
      transaction.type === "transfer" &&
      transaction.walletId === transaction.toWalletId
    ) {
      setError("Source and destination wallets must be different");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transaction,
          amount: parseFloat(transaction.amount),
          date: new Date(transaction.date + "T12:00:00").toISOString(),
        }),
      });

      if (response.ok) {
        setSuccess(true);

        // Clear form
        setTransaction({
          title: "",
          amount: "",
          type: transaction.type,
          categoryId: "",
          walletId:
            wallets.find((w: Wallet) => w.isDefault)?._id ||
            wallets[0]?._id ||
            "",
          toWalletId: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
        });

        // Navigate after success animation
        setTimeout(() => {
          router.push("/transactions");
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setTransaction({
      title: "",
      amount: "",
      type: transaction.type,
      categoryId: "",
      walletId:
        wallets.find((w: Wallet) => w.isDefault)?._id || wallets[0]?._id || "",
      toWalletId: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setError("");
    setSuccess(false);
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === transaction.type
  );

  const getTypeConfig = () => {
    switch (transaction.type) {
      case "income":
        return {
          title: "Add Income",
          subtitle: "Record money coming in",
          icon: ArrowUpCircle,
          color: "text-emerald-600",
          bgColor: "bg-emerald-500",
          lightBg: "bg-emerald-50",
          borderColor: "border-emerald-200",
          gradient: "from-emerald-500 to-green-500",
          ringColor: "focus:ring-emerald-500/30",
        };
      case "expense":
        return {
          title: "Add Expense",
          subtitle: "Record money going out",
          icon: ArrowDownCircle,
          color: "text-rose-600",
          bgColor: "bg-rose-500",
          lightBg: "bg-rose-50",
          borderColor: "border-rose-200",
          gradient: "from-rose-500 to-red-500",
          ringColor: "focus:ring-rose-500/30",
        };
      case "transfer":
        return {
          title: "Transfer Money",
          subtitle: "Move money between wallets",
          icon: ArrowLeftRight,
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          lightBg: "bg-blue-50",
          borderColor: "border-blue-200",
          gradient: "from-blue-500 to-indigo-500",
          ringColor: "focus:ring-blue-500/30",
        };
      default:
        return {
          title: "Add Transaction",
          subtitle: "Create a new transaction",
          icon: FileText,
          color: "text-gray-600",
          bgColor: "bg-gray-500",
          lightBg: "bg-gray-50",
          borderColor: "border-gray-200",
          gradient: "from-gray-500 to-slate-500",
          ringColor: "focus:ring-gray-500/30",
        };
    }
  };

  const typeConfig = getTypeConfig();
  const TypeIcon = typeConfig.icon;

  // Format currency display
  const formatCurrency = (amount: number, currency: string = "USD") => {
    const currencyMap: { [key: string]: string } = {
      $: "USD",
      "₹": "INR",
      "€": "EUR",
      "£": "GBP",
      "¥": "JPY",
      PKR: "PKR",
      USD: "USD",
      EUR: "EUR",
      GBP: "GBP",
      INR: "INR",
      JPY: "JPY",
    };

    const validCurrency = currencyMap[currency] || "USD";

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: validCurrency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  const quickAmounts =
    transaction.type === "transfer"
      ? [100, 500, 1000, 5000]
      : [10, 50, 100, 500];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white">
          <CardContent className="p-8 text-center">
            <div
              className={`inline-flex p-4 rounded-full ${typeConfig.lightBg} ${typeConfig.borderColor} border-2 mb-6`}
            >
              <Check className={`h-8 w-8 ${typeConfig.color}`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Transaction Added!
            </h2>
            <p className="text-gray-600 mb-6">
              Your {transaction.type} has been successfully recorded.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
              <div
                className={`bg-gradient-to-r ${typeConfig.gradient} h-1 rounded-full animate-pulse`}
                style={{ width: "100%" }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to transactions...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${typeConfig.gradient} text-white relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 h-10 w-10 p-0"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {typeConfig.title}
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                {typeConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Transaction Type Tabs */}
          <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
            {[
              { type: "income", icon: ArrowUpCircle, label: "Income" },
              { type: "expense", icon: ArrowDownCircle, label: "Expense" },
              { type: "transfer", icon: ArrowLeftRight, label: "Transfer" },
            ].map(({ type: btnType, icon: Icon, label }) => (
              <button
                key={btnType}
                onClick={() =>
                  setTransaction((prev) => ({
                    ...prev,
                    type: btnType as "income" | "expense" | "transfer",
                    categoryId: "",
                  }))
                }
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 text-sm font-medium ${
                  transaction.type === btnType
                    ? "bg-white text-gray-900 shadow-lg transform scale-[0.98]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="container mx-auto px-4 -mt-4 pb-8 relative z-20">
        <Card className="shadow-2xl border-0 bg-white rounded-t-3xl">
          <CardContent className="p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount - Primary Field */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transaction.amount}
                    onChange={(e) =>
                      setTransaction((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="h-14 pl-12 pr-4 text-2xl font-bold bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTransaction((prev) => ({
                          ...prev,
                          amount: amount.toString(),
                        }))
                      }
                      disabled={loading}
                      className="h-9 text-xs font-medium bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Title
                </label>
                <Input
                  value={transaction.title}
                  onChange={(e) =>
                    setTransaction((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter transaction title"
                  className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Category (not for transfers) */}
                {transaction.type !== "transfer" && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Category
                    </label>
                    <select
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 transition-all disabled:opacity-50"
                      value={transaction.categoryId}
                      onChange={(e) =>
                        setTransaction((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }))
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">Select Category</option>
                      {filteredCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </label>
                  <Input
                    type="date"
                    value={transaction.date}
                    onChange={(e) =>
                      setTransaction((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Wallet Selection */}
              <div
                className={`space-y-6 ${
                  transaction.type === "transfer"
                    ? "grid md:grid-cols-2 gap-6"
                    : ""
                }`}
              >
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <WalletIcon className="h-4 w-4" />
                    {transaction.type === "transfer" ? "From Wallet" : "Wallet"}
                  </label>
                  <select
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 transition-all disabled:opacity-50"
                    value={transaction.walletId}
                    onChange={(e) =>
                      setTransaction((prev) => ({
                        ...prev,
                        walletId: e.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  >
                    <option value="">Select Wallet</option>
                    {wallets.map((wallet) => (
                      <option key={wallet._id} value={wallet._id}>
                        {wallet.icon} {wallet.name} -{" "}
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Wallet (for transfers) */}
                {transaction.type === "transfer" && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      To Wallet
                    </label>
                    <select
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 transition-all disabled:opacity-50"
                      value={transaction.toWalletId}
                      onChange={(e) =>
                        setTransaction((prev) => ({
                          ...prev,
                          toWalletId: e.target.value,
                        }))
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">Select Destination</option>
                      {wallets
                        .filter((w) => w._id !== transaction.walletId)
                        .map((wallet) => (
                          <option key={wallet._id} value={wallet._id}>
                            {wallet.icon} {wallet.name} -{" "}
                            {formatCurrency(wallet.balance, wallet.currency)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                  <span className="text-xs text-gray-500 font-normal">
                    (Optional)
                  </span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 resize-none transition-all disabled:opacity-50"
                  rows={3}
                  value={transaction.description}
                  onChange={(e) =>
                    setTransaction((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Add a note about this transaction..."
                  disabled={loading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForm}
                  disabled={loading}
                  className="flex-1 h-12 bg-gray-50 border-gray-200 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 h-12 bg-gradient-to-r ${typeConfig.gradient} hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add{" "}
                      {transaction.type === "income"
                        ? "Income"
                        : transaction.type === "expense"
                        ? "Expense"
                        : "Transfer"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/transactions")}
            disabled={loading}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
          >
            View All Transactions
          </Button>
        </div>
      </div>
    </div>
  );
}
