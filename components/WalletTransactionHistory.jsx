"use client";
import { useState, useEffect, useRef } from "react";
import { DollarSign, Video, TrendingUp, Calendar, Filter, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

/**
 * Get transaction type icon
 */
function getTransactionIcon(type) {
  switch (type) {
    case "FUNDING":
      return ArrowDownCircle; // Money coming in
    case "SESSION_DEBIT":
      return Video; // Session payment
    case "EARNING_CREDIT":
      return TrendingUp; // Earnings
    default:
      return DollarSign;
  }
}

/**
 * Get transaction type color
 */
function getTransactionColor(type) {
  switch (type) {
    case "FUNDING":
      return "text-green-400"; // Green for money in
    case "SESSION_DEBIT":
      return "text-orange-400"; // Orange/red for money out
    case "EARNING_CREDIT":
      return "text-blue-400"; // Blue/teal for earnings
    default:
      return "text-green-400";
  }
}

/**
 * Get transaction type background gradient
 */
function getTransactionGradient(type) {
  switch (type) {
    case "FUNDING":
      return "from-green-500 to-emerald-500";
    case "SESSION_DEBIT":
      return "from-orange-500 to-red-500";
    case "EARNING_CREDIT":
      return "from-blue-500 to-cyan-500";
    default:
      return "from-green-500 to-emerald-500";
  }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format amount for display
 */
function formatAmount(amount) {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const formatted = Math.abs(numAmount).toFixed(2);
  return numAmount >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

/**
 * WalletTransactionHistory - Display wallet transaction history
 * 
 * Props:
 * - userId: User ID for fetching transactions
 * 
 * NOTE: This component ONLY displays wallet_ledger transactions.
 * Credit transactions (credit_ledger) are completely filtered out.
 */
export default function WalletTransactionHistory({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const scrollContainerRef = useRef(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (userId) {
      fetchTransactions(true);
    }
  }, [userId]);

  useEffect(() => {
    // Reset to first page when filters change
    setPage(1);
    setHasMore(true);
    if (userId) {
      fetchTransactions(true);
    }
  }, [filterType, dateRange]);

  const fetchTransactions = async (reset = false) => {
    if (reset) {
      setPage(1);
      setLoading(true);
    }

    try {
      // Build query parameters
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: reset ? '0' : ((page - 1) * ITEMS_PER_PAGE).toString(),
      });

      if (filterType !== "all") {
        params.append('type', filterType);
      }

      // Add date range filter
      if (dateRange !== "all") {
        const now = new Date();
        const cutoffDate = new Date();
        switch (dateRange) {
          case "week":
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case "month":
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        params.append('date_from', cutoffDate.toISOString());
      }

      const res = await fetch(`/api/marketplace/wallet/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const fetchedTransactions = data.data.transactions || [];
          setTotal(data.data.total || 0);
          setHasMore(data.data.has_more || false);

          if (reset) {
            setTransactions(fetchedTransactions);
            setPage(1); // Reset page when filters change
          } else {
            // Append new transactions for pagination
            setTransactions((prev) => {
              // Avoid duplicates by checking IDs
              const existingIds = new Set(prev.map(t => t.id));
              const newTransactions = fetchedTransactions.filter(t => !existingIds.has(t.id));
              return [...prev, ...newTransactions];
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch wallet transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load more transactions when page changes
  useEffect(() => {
    if (page > 1 && !loading && hasMore) {
      fetchTransactions(false);
    }
  }, [page]);

  // Infinite scroll on scroll to bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || loading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        // Near bottom, load more
        setPage((prev) => prev + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  if (loading && transactions.length === 0) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-400" />
        </div>
      </div>
    );
  }

  // Display all loaded transactions (pagination handled by API offset/limit)
  const displayedTransactions = transactions;
  const canLoadMore = hasMore && transactions.length < total;

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Transaction History</h2>
          <p className="text-green-200 text-sm sm:text-base">
            {total} transaction{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-green-200" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              <option value="FUNDING">Funding</option>
              <option value="SESSION_DEBIT">Sessions</option>
              <option value="EARNING_CREDIT">Earnings</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-200" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="max-h-96 overflow-y-auto space-y-3 pr-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.3) transparent",
        }}
      >
        {displayedTransactions.length > 0 ? (
          displayedTransactions.map((transaction) => {
            const Icon = getTransactionIcon(transaction.transaction_type);
            const iconColor = getTransactionColor(transaction.transaction_type);
            const gradient = getTransactionGradient(transaction.transaction_type);
            const amount = transaction.amount;
            const isPositive = amount >= 0;

            return (
              <div
                key={transaction.id}
                className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 smooth-transition"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-white`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold text-sm sm:text-base">
                          {transaction.description}
                        </h3>
                      </div>
                      <div className={`font-bold text-sm sm:text-base ${isPositive ? 'text-green-400' : 'text-orange-400'}`}>
                        {formatAmount(amount)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-green-200 text-xs sm:text-sm">
                        {formatDate(transaction.created_at)}
                      </p>
                      {transaction.meta?.stripe_payment_intent_id && (
                        <p className="text-green-300 text-xs opacity-70">
                          {transaction.meta.stripe_payment_intent_id.substring(0, 12)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-green-400 opacity-50 mx-auto mb-4" />
            <p className="text-green-200 text-sm sm:text-base">
              No transactions found
            </p>
            <p className="text-green-300 text-xs mt-2 opacity-70">
              Your wallet transaction history will appear here
            </p>
          </div>
        )}

        {/* Load More Indicator */}
        {canLoadMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

