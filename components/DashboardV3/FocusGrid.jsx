"use client";
import { useState, useEffect } from "react";
import { Heart, Briefcase, Sparkles, Brain, Star, Users, Loader2, X } from "lucide-react";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";

// Default tile configuration
const defaultTiles = [
  {
    id: "love",
    title: "Love & Relationships",
    description: "Insights into your romantic life and connections",
    icon: Heart,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    type: "tarot",
    spreadType: "daily-love",
    readingType: "love",
    focusOptional: "romantic relationships"
  },
  {
    id: "career",
    title: "Career & Purpose",
    description: "Guidance for your professional path",
    icon: Briefcase,
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    type: "tarot",
    spreadType: "career",
    readingType: "career",
    focusOptional: "career and purpose"
  },
  {
    id: "daily-tarot",
    title: "Daily Tarot Pull",
    description: "Your card of the day for guidance",
    icon: Sparkles,
    gradient: "from-purple-500 via-pink-500 to-orange-500",
    type: "tarot",
    spreadType: "daily",
    readingType: "general",
    focusOptional: "daily guidance"
  },
  {
    id: "channeled",
    title: "Channeled Reading",
    description: "Deep spiritual messages channeled for you",
    icon: Brain,
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    type: "tarot",
    spreadType: "three-card",
    readingType: "channeled",
    focusOptional: "spiritual guidance"
  },
  {
    id: "birth-chart",
    title: "Birth Chart",
    description: "Discover your astrological blueprint",
    icon: Star,
    gradient: "from-yellow-500 via-orange-500 to-pink-500",
    type: "birth-chart",
    requiresForm: true,
    link: "/birth-chart"
  },
  {
    id: "compatibility",
    title: "Compatibility",
    description: "Explore relationship dynamics",
    icon: Users,
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    type: "compatibility",
    requiresForm: true,
    link: "/compatibility"
  }
];

/**
 * FocusGrid - Clickable tiles for fast access to reading types
 * 
 * Props:
 * - tilesConfig: Optional array of tile configurations (defaults to defaultTiles)
 * - userId: User ID for generating readings
 * - onReadingComplete: Callback when a reading is completed
 */
export default function FocusGrid({ tilesConfig, userId, onReadingComplete }) {
  const [tiles, setTiles] = useState(defaultTiles);
  const [loadingTile, setLoadingTile] = useState(null);
  const [readingResult, setReadingResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch tiles config from API if available, otherwise use defaults
    const fetchTilesConfig = async () => {
      try {
        const res = await fetch("/api/dashboard/tiles");
        if (res.ok) {
          const data = await res.json();
          if (data.tiles && Array.isArray(data.tiles)) {
            setTiles(data.tiles);
          }
        }
      } catch (err) {
        // Use default tiles if API fails
        console.info("Using default tiles configuration");
      }
    };

    // Use provided config or fetch from API
    if (tilesConfig && Array.isArray(tilesConfig)) {
      setTiles(tilesConfig);
    } else {
      fetchTilesConfig();
    }
  }, [tilesConfig]);

  const handleTileClick = async (tile) => {
    // If tile requires a form (birth chart, compatibility), redirect to that page
    if (tile.requiresForm && tile.link) {
      window.location.href = tile.link;
      return;
    }

    setLoadingTile(tile.id);
    setError(null);
    setReadingResult(null);

    try {
      // Call the generate endpoint
      const response = await fetch("/api/readings/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: tile.type,
          focusOptional: tile.focusOptional,
          spreadType: tile.spreadType,
          readingType: tile.readingType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits
          setError({
            type: "insufficient_credits",
            message: data.error || "Insufficient credits",
            details: data.details,
            cost: data.cost,
          });
        } else {
          setError({
            type: "error",
            message: data.error || "Failed to generate reading",
            details: data.details,
          });
        }
        setLoadingTile(null);
        return;
      }

      // Success - show result
      setReadingResult({
        tile,
        reading: data.reading || data,
      });
      setLoadingTile(null);

      // Call completion callback if provided
      if (onReadingComplete) {
        onReadingComplete(data.reading || data);
      }
    } catch (err) {
      console.error("Error generating reading:", err);
      setError({
        type: "error",
        message: "Failed to connect to server. Please try again.",
      });
      setLoadingTile(null);
    }
  };

  const handleCloseResult = () => {
    setReadingResult(null);
    setError(null);
  };

  return (
    <>
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Focus Your Energy</h2>
          <p className="text-purple-200 text-sm sm:text-base">Choose a reading type to receive personalized guidance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const isLoading = loadingTile === tile.id;

            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={isLoading}
                className={`group relative bg-gradient-to-br ${tile.gradient} text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-left disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  {isLoading && (
                    <span className="text-xs opacity-80">Generating...</span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{tile.title}</h3>
                <p className="text-sm text-white text-opacity-90 leading-relaxed">
                  {tile.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleCloseResult}>
          <div 
            className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Error</h3>
              <button
                onClick={handleCloseResult}
                className="text-purple-200 hover:text-white smooth-transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white mb-2">{error.message}</p>
              {error.details && (
                <p className="text-purple-200 text-sm">{error.details}</p>
              )}
            </div>

            {error.type === "insufficient_credits" && (
              <div className="space-y-3">
                <p className="text-purple-200 text-sm">
                  This reading requires {error.cost} credit{error.cost !== 1 ? "s" : ""}.
                </p>
                <Link
                  href="/credits"
                  onClick={handleCloseResult}
                  className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition text-center"
                >
                  Purchase Credits
                </Link>
              </div>
            )}

            <button
              onClick={handleCloseResult}
              className="w-full mt-4 px-6 py-2 text-purple-200 hover:text-white smooth-transition text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reading Result Panel */}
      {readingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleCloseResult}>
          <div 
            className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{readingResult.tile.title}</h3>
                <p className="text-purple-200 text-sm">Your reading is ready</p>
              </div>
              <button
                onClick={handleCloseResult}
                className="text-purple-200 hover:text-white smooth-transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tarot Cards */}
            {readingResult.reading.cards && readingResult.reading.cards.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Your Cards</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {readingResult.reading.cards.map((card, idx) => (
                    <div key={idx} className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20">
                      {card.image && (
                        <div className="mb-3">
                          <img 
                            src={card.image} 
                            alt={card.name}
                            className={`w-full h-auto rounded-lg ${card.reversed ? 'rotate-180' : ''}`}
                          />
                        </div>
                      )}
                      <h5 className="text-white font-semibold text-center mb-1">{card.name}</h5>
                      {card.position && (
                        <p className="text-purple-200 text-xs text-center">{card.position}</p>
                      )}
                      {card.reversed && (
                        <span className="block text-center text-xs text-purple-300 mt-1">Reversed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interpretation */}
            {readingResult.reading.interpretation && (
              <div className="bg-white bg-opacity-10 rounded-xl p-6 border border-white border-opacity-20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Interpretation</h4>
                <MarkdownRenderer text={readingResult.reading.interpretation} className="text-white text-opacity-90 leading-relaxed" />
              </div>
            )}

            {/* Summary */}
            {readingResult.reading.summary && (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-white border-opacity-20 mb-6">
                <p className="text-white text-sm italic">{readingResult.reading.summary}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseResult}
                className="flex-1 px-6 py-3 bg-white bg-opacity-20 text-white font-semibold rounded-xl hover:bg-opacity-30 smooth-transition"
              >
                Close
              </button>
              <Link
                href="/dashboard"
                onClick={handleCloseResult}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition text-center"
              >
                View All Readings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

