"use client";

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, Sparkles, ArrowLeft, Filter, Search, Trash2, Edit } from "lucide-react";

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, filterType]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/journal?limit=100");
      const data = await res.json();
      
      if (res.ok && data.success) {
        setEntries(data.entries || []);
      }
    } catch (error) {
      logger.error("Failed to fetch journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) {
      return;
    }

    try {
      // Note: We'd need to add a DELETE endpoint for this
      // For now, just remove from local state
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error) {
      logger.error("Failed to delete entry:", error);
      alert("Failed to delete entry");
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesType = filterType === "all" || entry.type === filterType;
    const matchesSearch = !searchQuery || 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.sign && entry.sign.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const entryTypes = ["all", "reading", "briefing", "reflection", "general"];

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-200 animate-pulse">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      <div className="p-8 sm:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white smooth-transition mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold gradient-text mb-2">My Spiritual Journal</h1>
                <p className="text-purple-200">Your personal collection of readings, insights, and reflections</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glassmorphic rounded-2xl p-6 mb-6 apple-shadow-lg border border-white border-opacity-40">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-200" />
                <input
                  type="text"
                  placeholder="Search journal entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {entryTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl font-medium smooth-transition ${
                      filterType === type
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white bg-opacity-10 text-purple-200 hover:bg-opacity-20 border border-white border-opacity-20"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Entries List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-purple-200">Loading entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="glassmorphic rounded-2xl p-12 text-center apple-shadow-lg border border-white border-opacity-40">
              <BookOpen className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No journal entries yet</h3>
              <p className="text-purple-200 mb-6">
                {searchQuery || filterType !== "all"
                  ? "No entries match your filters"
                  : "Start saving readings and insights to your journal"}
              </p>
              {!searchQuery && filterType === "all" && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition"
                >
                  <Sparkles className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40 hover:border-opacity-60 smooth-transition cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold uppercase">
                          {entry.type || "general"}
                        </span>
                        {entry.sign && (
                          <span className="px-3 py-1 rounded-full bg-pink-500/30 text-pink-200 text-xs font-semibold">
                            {entry.sign}
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-purple-200 text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.entry_date || entry.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <p className="text-white leading-relaxed line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      className="p-2 rounded-xl hover:bg-red-500/20 text-red-300 hover:text-red-200 smooth-transition"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Entry Detail Modal */}
          {selectedEntry && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedEntry(null)}
            >
              <div
                className="glassmorphic rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto apple-shadow-lg border border-white border-opacity-40"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 rounded-full bg-purple-500/30 text-purple-200 font-semibold uppercase">
                      {selectedEntry.type || "general"}
                    </span>
                    {selectedEntry.sign && (
                      <span className="px-4 py-2 rounded-full bg-pink-500/30 text-pink-200 font-semibold">
                        {selectedEntry.sign}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 text-purple-200 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedEntry.entry_date || selectedEntry.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="text-white whitespace-pre-line leading-relaxed">
                    {selectedEntry.content}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


