"use client";
import { useState } from "react";
import { Heart, Loader2, X, Sparkles, Info } from "lucide-react";
import { zodiacSigns } from "@/lib/zodiac-data";
import Link from "next/link";
import { apiClient } from '@/lib/api-client';
import { useApiClientWithToast } from '@/src/hooks/useApiClientWithToast';

/**
 * Get sign emoji
 */
function getSignEmoji(sign) {
  const emojis = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑",
    Aquarius: "♒",
    Pisces: "♓",
  };
  return emojis[sign] || "⭐";
}

/**
 * Get primary reason for high compatibility
 */
function getPrimaryReason(match) {
  if (match.reasons?.length > 0) {
    return match.reasons[0];
  }
  return `${match.element} sign compatibility`;
}

/**
 * Radial Progress Bar Component
 */
function RadialProgress({ percentage, size = 60 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-white text-opacity-10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-purple-400 smooth-transition"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{percentage}%</span>
      </div>
    </div>
  );
}

/**
 * BestMatches - Shows top matching signs with compatibility scores
 * 
 * Props:
 * - userId: User ID for fetching compatibility data
 */
export default function BestMatches({ userId }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comparing, setComparing] = useState(false);

  const { data, loading, error } = useApiClientWithToast(
    apiClient,
    (c) => c.get(`/api/compatibility/top?userId=${userId}`, { timeout: 15000 }),
    [userId],
    { toastMessages: { error: "Could not load compatibility matches." } }
  );

  const matches = data?.matches || [];

  const handleCompare = (match) => {
    setSelectedMatch(match);
    setShowModal(true);
  };

  const handleStartComparison = () => {
    if (selectedMatch) {
      // Redirect to compatibility page
      window.location.href = `/compatibility`;
    }
  };

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-purple-300 mx-auto mb-4 opacity-50" />
          <p className="text-purple-200 text-lg mb-2">No matches available</p>
          <p className="text-purple-200/80 text-sm">
            Create a birth chart to see your compatibility matches
          </p>
          <Link
            href="/birth-chart"
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition"
          >
            Create Birth Chart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Best Matches</h2>
            <p className="text-purple-200 text-sm sm:text-base">Your top compatibility matches</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.slice(0, 5).map((match, index) => (
            <div
              key={match.sign}
              className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 smooth-transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getSignEmoji(match.sign)}</div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{match.sign}</h3>
                    <p className="text-purple-200 text-xs">{match.element} Element</p>
                  </div>
                </div>
                <RadialProgress percentage={match.score} size={60} />
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <p className="text-purple-200 text-xs font-medium">
                    {getPrimaryReason(match)}
                  </p>
                </div>
                {match.reasons && match.reasons.length > 1 && (
                  <p className="text-purple-200/70 text-xs">
                    +{match.reasons.length - 1} more compatibility factors
                  </p>
                )}
              </div>

              <button
                onClick={() => handleCompare(match)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 smooth-transition text-sm"
              >
                Compare
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Compare Modal */}
      {showModal && selectedMatch && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 rounded-3xl p-8 apple-shadow-xl border border-white border-opacity-40 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white hover:text-purple-200 smooth-transition"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">{getSignEmoji(selectedMatch.sign)}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{selectedMatch.sign}</h3>
                <p className="text-purple-200 text-sm">{selectedMatch.element} Element</p>
              </div>
              <RadialProgress percentage={selectedMatch.score} size={80} />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Why This Match?</h4>
              <div className="space-y-2">
                {selectedMatch.reasons?.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2 bg-white bg-opacity-10 rounded-lg p-3">
                    <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-purple-200 text-sm">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStartComparison}
                disabled={comparing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {comparing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Run Full Comparison</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 smooth-transition border border-white border-opacity-20"
              >
                Close
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200 text-xs">
                  Full comparison requires birth date, time, and location for both people to generate a detailed compatibility report.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
