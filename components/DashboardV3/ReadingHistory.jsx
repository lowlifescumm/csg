"use client";
import { useState, useEffect, useRef } from "react";
import { BookOpen, Calendar, Filter, Sparkles, Star, Eye, RotateCcw, Loader2, X, Heart } from "lucide-react";
import Link from "next/link";

/**
 * Get reading type icon
 */
function getReadingIcon(type) {
  switch (type) {
    case "tarot":
      return Sparkles;
    case "birth_chart":
    case "birth-chart":
      return Star;
    default:
      return BookOpen;
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
  });
}

/**
 * Get short excerpt from reading
 */
function getExcerpt(reading) {
  if (reading.result?.interpretation) {
    return reading.result.interpretation.substring(0, 120) + "...";
  }
  if (reading.result?.summary) {
    return reading.result.summary;
  }
  if (reading.question) {
    return reading.question;
  }
  return "No excerpt available";
}

/**
 * ReadingHistory - Scrollable, filterable reading history panel
 * 
 * Props:
 * - userId: User ID for fetching readings
 * - onReadingSelect: Callback when reading is selected (optional)
 */
export default function ReadingHistory({ userId, onReadingSelect }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savingToJournal, setSavingToJournal] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (userId) {
      fetchReadings();
      fetchFavorites();
    }
  }, [userId]);

  useEffect(() => {
    // Reset to first page when filters change
    setPage(1);
    setHasMore(true);
    if (userId) {
      fetchReadings(true);
    }
  }, [filterType, dateRange, favoritesOnly]);

  const fetchReadings = async (reset = false) => {
    if (reset) {
      setPage(1);
      setLoading(true);
    }

    try {
      const res = await fetch("/api/readings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Combine tarot and birth chart readings
          const allReadings = [
            ...(data.readings?.tarot || []).map((r) => ({ ...r, type: "tarot" })),
            ...(data.readings?.birthCharts || []).map((r) => ({ ...r, type: "birth_chart" })),
          ];

          // Apply filters
          let filtered = allReadings;

          // Filter by type
          if (filterType !== "all") {
            filtered = filtered.filter((r) => r.type === filterType);
          }

          // Filter by date range
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
            filtered = filtered.filter((r) => {
              const readingDate = new Date(r.created_at);
              return readingDate >= cutoffDate;
            });
          }

          // Filter by favorites
          if (favoritesOnly) {
            filtered = filtered.filter((r) => favoriteIds.has(r.id.toString()));
          }

          // Sort by date (newest first)
          filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          if (reset) {
            setReadings(filtered);
          } else {
            setReadings(filtered);
          }
          setHasMore(filtered.length > page * ITEMS_PER_PAGE);
        }
      }
    } catch (err) {
      console.error("Failed to fetch readings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/user/favorites?type=reading");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.favorites) {
          const ids = new Set(data.favorites.map((f) => f.item_id));
          setFavoriteIds(ids);
        }
      }
    } catch (err) {
      console.log("Could not fetch favorites:", err);
    }
  };

  const handleView = (reading) => {
    setSelectedReading(reading);
    setShowModal(true);
    if (onReadingSelect) {
      onReadingSelect(reading);
    }
  };

  const handleSaveToJournal = async (reading) => {
    setSavingToJournal(reading.id);
    try {
      const excerpt = getExcerpt(reading);
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `${reading.question || "Reading"}\n\n${excerpt}`,
          type: "reading",
          metadata: {
            readingId: reading.id,
            readingType: reading.type,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Show success feedback (could use toast)
        alert("Saved to journal!");
      }
    } catch (err) {
      console.error("Error saving to journal:", err);
      alert("Failed to save to journal");
    } finally {
      setSavingToJournal(null);
    }
  };

  const handleRerun = (reading) => {
    // Redirect to appropriate reading type page
    if (reading.type === "tarot") {
      window.location.href = "/dashboard#tarot-section";
    } else if (reading.type === "birth_chart") {
      window.location.href = "/birth-chart";
    }
  };

  const handleToggleFavorite = async (reading) => {
    const isFavorited = favoriteIds.has(reading.id.toString());
    
    try {
      if (isFavorited) {
        // Remove from favorites
        await fetch(`/api/user/favorites?type=reading&itemId=${reading.id}`, {
          method: "DELETE",
        });
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reading.id.toString());
          return newSet;
        });
      } else {
        // Add to favorites
        await fetch("/api/user/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "reading",
            itemId: reading.id,
            name: reading.question || `${reading.type} reading`,
            metadata: {
              readingType: reading.type,
              date: reading.created_at,
            },
          }),
        });
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(reading.id.toString());
          return newSet;
        });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const displayedReadings = readings.slice(0, page * ITEMS_PER_PAGE);
  const canLoadMore = readings.length > displayedReadings.length;

  // Infinite scroll on scroll to bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !canLoadMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        // Near bottom, load more
        setPage((prev) => prev + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [canLoadMore]);

  if (loading && readings.length === 0) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Reading History</h2>
            <p className="text-purple-200 text-sm sm:text-base">
              {readings.length} reading{readings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-200" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="tarot">Tarot</option>
                <option value="birth_chart">Birth Chart</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-200" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Favorites Filter */}
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium smooth-transition flex items-center gap-2 ${
                favoritesOnly
                  ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                  : "bg-white bg-opacity-10 text-purple-200 hover:bg-opacity-20 border border-white border-opacity-20"
              }`}
            >
              <Heart className={`w-4 h-4 ${favoritesOnly ? "fill-current" : ""}`} />
              Favorites
            </button>
          </div>
        </div>

        {/* Reading List - Scrollable */}
        <div
          ref={scrollContainerRef}
          className="max-h-96 overflow-y-auto space-y-3 pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.3) transparent",
          }}
        >
          {displayedReadings.length > 0 ? (
            displayedReadings.map((reading) => {
              const Icon = getReadingIcon(reading.type);
              const isFavorited = favoriteIds.has(reading.id.toString());

              return (
                <div
                  key={reading.id}
                  className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 smooth-transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-purple-200">
                            {formatDate(reading.created_at)}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/30 text-purple-200 capitalize">
                            {reading.type.replace("_", " ")}
                          </span>
                          {reading.result?.spreadType && (
                            <span className="text-xs text-purple-200/70">
                              {reading.result.spreadType.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(reading)}
                          className={`p-1.5 rounded-lg smooth-transition ${
                            isFavorited
                              ? "text-red-400 bg-red-500/20"
                              : "text-purple-200 hover:bg-white hover:bg-opacity-10"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      {reading.question && (
                        <p className="text-white font-medium mb-2 line-clamp-1">
                          {reading.question}
                        </p>
                      )}

                      <p className="text-purple-200 text-sm line-clamp-2 mb-3">
                        {getExcerpt(reading)}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleView(reading)}
                          className="px-3 py-1.5 bg-white bg-opacity-10 text-white text-sm font-medium rounded-lg hover:bg-opacity-20 smooth-transition flex items-center gap-1.5 border border-white border-opacity-20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => handleSaveToJournal(reading)}
                          disabled={savingToJournal === reading.id}
                          className="px-3 py-1.5 bg-white bg-opacity-10 text-white text-sm font-medium rounded-lg hover:bg-opacity-20 smooth-transition flex items-center gap-1.5 border border-white border-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingToJournal === reading.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              Save to Journal
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRerun(reading)}
                          className="px-3 py-1.5 bg-white bg-opacity-10 text-white text-sm font-medium rounded-lg hover:bg-opacity-20 smooth-transition flex items-center gap-1.5 border border-white border-opacity-20"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Re-run
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-purple-300 mx-auto mb-4 opacity-50" />
              <p className="text-purple-200 text-lg mb-2">No readings found</p>
              <p className="text-purple-200/80 text-sm">
                {favoritesOnly
                  ? "No favorite readings yet"
                  : filterType !== "all" || dateRange !== "all"
                  ? "Try adjusting your filters"
                  : "Start by getting your first reading!"}
              </p>
            </div>
          )}
        </div>

        {/* Load More / Pagination */}
        {canLoadMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 smooth-transition border border-white border-opacity-20"
            >
              Load More ({readings.length - displayedReadings.length} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Reading Detail Modal */}
      {showModal && selectedReading && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 rounded-3xl p-8 apple-shadow-xl border border-white border-opacity-40 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white hover:text-purple-200 smooth-transition"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const Icon = getReadingIcon(selectedReading.type);
                  return (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {selectedReading.question || `${selectedReading.type} Reading`}
                  </h3>
                  <p className="text-purple-200 text-sm">{formatDate(selectedReading.created_at)}</p>
                </div>
              </div>

              {/* Cards (for tarot readings) */}
              {selectedReading.result?.cards && selectedReading.result.cards.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Cards</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedReading.result.cards.map((card, idx) => (
                      <div key={idx} className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20">
                        <p className="text-white font-semibold mb-1">{card.name || "Card"}</p>
                        {card.position && (
                          <p className="text-purple-200 text-xs">{card.position}</p>
                        )}
                        {card.reversed && (
                          <span className="text-xs text-yellow-400">Reversed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretation */}
              {selectedReading.result?.interpretation && (
                <div className="bg-white bg-opacity-10 rounded-xl p-6 border border-white border-opacity-20">
                  <h4 className="text-lg font-semibold text-white mb-3">Interpretation</h4>
                  <p className="text-purple-200 leading-relaxed whitespace-pre-line">
                    {selectedReading.result.interpretation}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveToJournal(selectedReading)}
                disabled={savingToJournal === selectedReading.id}
                className="flex-1 px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 smooth-transition border border-white border-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingToJournal === selectedReading.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Save to Journal</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleRerun(selectedReading)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-run</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

