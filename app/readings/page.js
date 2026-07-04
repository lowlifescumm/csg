"use client";

import { useState, useMemo } from "react";
import { Sparkles, Loader2, ArrowLeft, BookOpen, Clock, MessageCircle, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";

const SPREAD_LABELS = {
  daily_tarot: { name: "Daily Tarot", color: "bg-indigo-500/20 text-indigo-300" },
  daily_love: { name: "Daily Love", color: "bg-pink-500/20 text-pink-300" },
  daily_career: { name: "Daily Career", color: "bg-amber-500/20 text-amber-300" },
  yes_no: { name: "Yes/No", color: "bg-emerald-500/20 text-emerald-300" },
  love_potential: { name: "Love Potential", color: "bg-rose-500/20 text-rose-300" },
  breakup: { name: "Breakup", color: "bg-violet-500/20 text-violet-300" },
  one_card: { name: "One Card", color: "bg-sky-500/20 text-sky-300" },
  past_present_future: { name: "Past/Present/Future", color: "bg-purple-500/20 text-purple-300" },
  daily_flirt: { name: "Daily Flirt", color: "bg-fuchsia-500/20 text-fuchsia-300" },
  yin_yang: { name: "Yin Yang", color: "bg-teal-500/20 text-teal-300" },
  custom_spread: { name: "Custom", color: "bg-slate-500/20 text-slate-300" },
};

function getSpreadLabel(spreadType) {
  return SPREAD_LABELS[spreadType] || { name: "Tarot", color: "bg-purple-500/20 text-purple-300" };
}

function getReadingType(reading) {
  const result = reading.result || {};
  return result.spreadType || reading.reading_type || "unknown";
}

function getCardCount(reading) {
  const result = reading.result || {};
  return result.cards?.length || 0;
}

export default function MyReadingsPage() {
  const [sortOrder, setSortOrder] = useState("newest");
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();

  const { data, loading, error, refetch } = useApiClientWithToast(
    apiClient,
    (c) => c.get("/api/readings"),
    [],
    {
      onErrorWithToast: (err) => {
        if (err.status === 401) {
          router.push("/login");
          return false;
        }
        return "Failed to load readings. Check your connection.";
      },
    },
  );

  const readings = data?.readings?.tarot || [];

  const filteredAndSorted = useMemo(() => {
    let result = [...readings];

    if (typeFilter !== "all") {
      result = result.filter((r) => getReadingType(r) === typeFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [readings, sortOrder, typeFilter]);

  const availableTypes = useMemo(() => {
    const types = new Set();
    readings.forEach((r) => types.add(getReadingType(r)));
    return Array.from(types).sort();
  }, [readings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Loading your readings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 bg-opacity-20 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-purple-200 mb-8">{error.message || "Something went wrong"}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/tarot"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tarot
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <BookOpen className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">My Readings</h1>
          <p className="text-xl text-purple-200">Your saved tarot readings</p>
        </div>

        {readings.length === 0 ? (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 border border-white border-opacity-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 bg-opacity-20 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-purple-300" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No readings yet</h2>
            <p className="text-purple-200 mb-6">Start your tarot journey with a free reading</p>
            <Link
              href="/tarot"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Get Your First Reading
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <p className="text-purple-300 text-sm">
                {readings.length} {readings.length === 1 ? "reading" : "readings"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white/10 text-purple-200 text-sm border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Types</option>
                    {availableTypes.map((t) => (
                      <option key={t} value={t}>
                        {getSpreadLabel(t).name}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-white/10 text-purple-200 text-sm border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAndSorted.map((reading) => {
                const result = reading.result || {};
                const cards = result.cards || [];
                const cardNames = cards.map((c) => c.name).join(", ");
                const spreadType = getReadingType(reading);
                const label = getSpreadLabel(spreadType);

                return (
                  <Link
                    key={reading.id}
                    href={`/readings/${reading.id}`}
                    className="block bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${label.color}`}>
                            {label.name}
                          </span>
                          {getCardCount(reading) > 0 && (
                            <span className="text-xs text-purple-400">
                              {getCardCount(reading)} cards
                            </span>
                          )}
                        </div>
                        {reading.question && (
                          <div className="flex items-start gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-purple-300 flex-shrink-0 mt-0.5" />
                            <p className="text-purple-200 text-sm line-clamp-2">
                              &ldquo;{reading.question}&rdquo;
                            </p>
                          </div>
                        )}
                        {cardNames && (
                          <p className="text-purple-300 text-xs truncate">
                            {cardNames}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-purple-300 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(reading.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredAndSorted.length === 0 && typeFilter !== "all" && (
              <div className="text-center py-12">
                <p className="text-purple-300">No readings match this filter.</p>
                <button
                  onClick={() => setTypeFilter("all")}
                  className="mt-2 text-purple-400 hover:text-purple-200 underline text-sm"
                >
                  Clear filter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
