"use client";

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, Sparkles, ArrowLeft, Filter, Search, Trash2, Star } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";

export default function JournalPage() {
  const router = useRouter();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReading, setSelectedReading] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await apiClient.get("/api/auth/user");
      
      if (!data.user) {
        router.push("/login?redirect=/journal");
      } else {
        setUser(data.user);
      }
    } catch (error) {
      router.push("/login?redirect=/journal");
    } finally {
      setLoading(false);
    }
  };

  useApiClientWithToast(
    apiClient,
    (c) => c.get("/api/saved-readings"),
    [user, filterType],
    {
      enabled: !!user,
      onSuccess: (data) => {
        if (data.success) {
          setReadings(data.readings || []);
        }
      },
      toastMessages: { error: "Failed to load saved readings." },
    },
  );

  const handleDelete = async (readingId) => {
    if (!confirm("Are you sure you want to delete this saved reading?")) {
      return;
    }
    // For now just remove from local state - would need DELETE endpoint
    setReadings(readings.filter(r => r.id !== readingId));
  };

  const filteredReadings = readings.filter(reading => {
    const matchesType = filterType === "all" || reading.readingType === filterType;
    const matchesSearch = !searchQuery || 
      reading.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.spreadType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.interpretation?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const readingTypes = ["all", "tarot", "birth-chart", "compatibility", "moon"];

  const getPreviewText = (interpretation) => {
    if (!interpretation) return "No interpretation available";
    return interpretation.split('\n')[0].substring(0, 120) + "...";
  };

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
                <h1 className="text-3xl sm:text-4xl font-semibold gradient-text mb-2">My Saved Readings</h1>
                <p className="text-purple-200">Your personal collection of tarot, birth charts, and compatibility readings</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glassmorphic rounded-2xl p-6 mb-6 apple-shadow-lg border border-white border-opacity-40">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-200" />
                <input
                  type="text"
                  placeholder="Search saved readings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {readingTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl font-medium smooth-transition ${
                      filterType === type
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white bg-opacity-10 text-purple-200 hover:bg-opacity-20 border border-white border-opacity-20"
                    }`}
                  >
                    {type === "all" ? "All" : type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Readings Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-purple-200">Loading readings...</p>
            </div>
          ) : filteredReadings.length === 0 ? (
            <div className="glassmorphic rounded-2xl p-12 text-center apple-shadow-lg border border-white border-opacity-40">
              <BookOpen className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No saved readings yet</h3>
              <p className="text-purple-200 mb-6">
                {searchQuery || filterType !== "all"
                  ? "No readings match your filters"
                  : "Save readings from tarot, birth charts, and compatibility to see them here"}
              </p>
              {!searchQuery && filterType === "all" && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Your First Reading
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40 hover:border-opacity-60 smooth-transition cursor-pointer"
                  onClick={() => setSelectedReading(reading)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold uppercase">
                      {reading.readingType || "reading"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(reading.id);
                      }}
                      className="p-2 rounded-xl hover:bg-red-500/20 text-red-300 hover:text-red-200 smooth-transition"
                      aria-label="Delete reading"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {reading.question || reading.spreadType || "Untitled Reading"}
                  </h3>
                  
                  <p className="text-purple-200 text-sm line-clamp-3 mb-4">
                    {getPreviewText(reading.interpretation)}
                  </p>
                  
                  <div className="flex items-center gap-2 text-purple-300 text-xs">
                    <Calendar className="w-3 h-3" />
                    {new Date(reading.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {reading.cards?.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{reading.cards.length} cards</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reading Detail Modal */}
          {selectedReading && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedReading(null)}
            >
              <div
                className="glassmorphic rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto apple-shadow-lg border border-white border-opacity-40"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 rounded-full bg-purple-500/30 text-purple-200 font-semibold uppercase">
                      {selectedReading.readingType || "reading"}
                    </span>
                    {selectedReading.spreadType && (
                      <span className="px-4 py-2 rounded-full bg-pink-500/30 text-pink-200 font-semibold">
                        {selectedReading.spreadType}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedReading(null)}
                    className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 text-purple-200 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedReading.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {selectedReading.question && (
                  <div className="mb-4 p-4 bg-white/10 rounded-xl">
                    <p className="text-purple-300 text-sm mb-1">Question asked:</p>
                    <p className="text-white font-medium">{selectedReading.question}</p>
                  </div>
                )}

                {selectedReading.cards && (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {selectedReading.cards.map((card, i) => (
                      <div key={i} className="text-center">
                        <img 
                          src={card.image} 
                          alt={card.name}
                          className={`w-full h-auto rounded-xl ${card.reversed ? 'rotate-180' : ''}`}
                        />
                        <p className="text-xs text-purple-200 mt-1">{card.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <div className="text-white whitespace-pre-line leading-relaxed">
                    {selectedReading.interpretation}
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
