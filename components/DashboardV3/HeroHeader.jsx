"use client";
const logger = require('../../lib/logger');
import { useState, useEffect } from "react";
import { Moon, CreditCard, Zap, Crown, X } from "lucide-react";
import Link from "next/link";

// Credit packs matching the existing system
const creditPacks = [
  { size: 10, price: 999, name: "10 Credits", description: "Perfect for trying out readings" },
  { size: 25, price: 1999, name: "25 Credits", description: "Great for regular use" },
  { size: 50, price: 3499, name: "50 Credits", description: "Best value for frequent users" },
  { size: 100, price: 5999, name: "100 Credits", description: "Maximum value pack" }
];

/**
 * HeroHeader - Top hero section with greeting, moon phase, credits, streak, and upgrade CTA
 * 
 * Props:
 * - user: User object with firstName, email
 * - credits: Credits data object
 * - streak: Streak data object with currentStreak
 * - moonPhase: Moon phase data (optional, will fetch if not provided)
 */
export default function HeroHeader({ user, credits, streak, moonPhase: propMoonPhase }) {
  const [moonPhase, setMoonPhase] = useState(propMoonPhase);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch moon phase if not provided
  useEffect(() => {
    const validMoonPhase = propMoonPhase && typeof propMoonPhase === 'object' && Object.keys(propMoonPhase).length > 0;
    if (!validMoonPhase) {
      fetch("/api/moon-phase")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0) {
            setMoonPhase(data.data);
          }
        })
        .catch(err => logger.error("Failed to fetch moon phase:", err));
    } else {
      setMoonPhase(propMoonPhase);
    }
  }, [propMoonPhase]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Safely extract values, ensuring we never render objects
  const safeCredits = credits && typeof credits === 'object' && Object.keys(credits).length > 0 ? credits : null;
  const safeStreak = streak && typeof streak === 'object' && Object.keys(streak).length > 0 ? streak : null;
  const safeMoonPhase = moonPhase && typeof moonPhase === 'object' && Object.keys(moonPhase).length > 0 ? moonPhase : null;
  
  const totalCredits = safeCredits?.stats?.totalAvailable || safeCredits?.credits || 0;
  const hasZeroCredits = totalCredits === 0;
  const currentStreak = safeStreak?.currentStreak || 0;

  const handlePurchaseClick = (pack) => {
    setSelectedPack(pack);
    setShowPurchaseModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowPurchaseModal(false);
    setSelectedPack(null);
    setError(null);
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    setLoading(true);
    setError(null);

    try {
      // Redirect to credits page with pack pre-selected
      window.location.href = `/credits?pack=${selectedPack.size}`;
    } catch (err) {
      setError("Failed to initialize purchase. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-purple-100 mb-6">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Left: Title and Greeting */}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              Your cosmic field is open ✨
            </h1>
            <p className="text-lg text-gray-600">
              {getGreeting()}, {user?.firstName || user?.email?.split("@")[0] || "there"}
            </p>
          </div>

          {/* Middle: Moon Phase Widget */}
          <div className="flex items-center gap-3 px-4">
            {safeMoonPhase ? (
              <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-2 border border-purple-100">
                <div className="text-3xl">{safeMoonPhase.phaseEmoji || "🌙"}</div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{safeMoonPhase.phaseName || "Loading..."}</div>
                  <div className="text-xs text-gray-500">Moon Phase</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-2 border border-purple-100">
                <Moon className="w-6 h-6 text-purple-400 animate-pulse" />
                <div className="text-sm text-gray-600">Loading moon...</div>
              </div>
            )}
          </div>

          {/* Right: Credits, Streak, Upgrade */}
          <div className="flex items-center gap-4">
            {/* Credits */}
            <button
              onClick={() => setShowPurchaseModal(true)}
              className={`flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 smooth-transition ${
                hasZeroCredits ? "animate-pulse" : ""
              }`}
            >
              <CreditCard className={`w-5 h-5 ${hasZeroCredits ? "text-yellow-500" : "text-purple-500"}`} />
              <span className="text-gray-800 font-semibold">{totalCredits}</span>
            </button>

            {/* Streak */}
            {currentStreak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-200">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-800 font-semibold">{currentStreak}</span>
                <span className="text-xs text-gray-500">days</span>
              </div>
            )}

            {/* Upgrade CTA */}
            <Link
              href="/subscription"
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition shadow-lg flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade</span>
            </Link>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Title and Greeting */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Your cosmic field is open ✨
            </h1>
            <p className="text-base text-gray-600">
              {getGreeting()}, {user?.firstName || user?.email?.split("@")[0] || "there"}
            </p>
          </div>

          {/* Moon Phase */}
          {safeMoonPhase ? (
            <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
              <div className="text-2xl">{safeMoonPhase.phaseEmoji || "🌙"}</div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{safeMoonPhase.phaseName || "Loading..."}</div>
                <div className="text-xs text-gray-500">Moon Phase</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
              <Moon className="w-5 h-5 text-purple-400 animate-pulse" />
              <div className="text-sm text-gray-600">Loading moon...</div>
            </div>
          )}

          {/* Credits, Streak, Upgrade Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 smooth-transition ${
                hasZeroCredits ? "animate-pulse" : ""
              }`}
            >
              <CreditCard className={`w-4 h-4 ${hasZeroCredits ? "text-yellow-500" : "text-purple-500"}`} />
              <span className="text-gray-800 font-semibold text-sm">{totalCredits}</span>
            </button>

            {currentStreak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-200">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-800 font-semibold text-sm">{currentStreak}</span>
              </div>
            )}

            <Link
              href="/subscription"
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition shadow-lg flex items-center gap-2 text-sm"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Purchase Credits</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 smooth-transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Current Credits Display */}
            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Current Credits</span>
                <span className="text-gray-800 font-semibold text-lg">{totalCredits}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Credit Packs */}
            <div className="space-y-3 mb-6">
              {creditPacks.map((pack) => (
                <button
                  key={pack.size}
                  onClick={() => handlePurchaseClick(pack)}
                  className="w-full p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 smooth-transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-800 font-semibold mb-1">{pack.name}</div>
                      <div className="text-gray-500 text-sm">{pack.description}</div>
                    </div>
                    <div className="text-gray-800 font-bold text-lg">
                      ${(pack.price / 100).toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Pack Checkout */}
            {selectedPack && (
              <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="mb-4">
                  <h3 className="text-gray-800 font-semibold mb-2">Selected Pack</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-800 font-semibold">{selectedPack.name}</div>
                      <div className="text-gray-500 text-sm">{selectedPack.description}</div>
                    </div>
                    <div className="text-gray-800 font-bold">
                      ${(selectedPack.price / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : `Continue to Checkout - ${(selectedPack.price / 100).toFixed(2)}`}
                </button>
                <button
                  onClick={() => setSelectedPack(null)}
                  className="w-full mt-2 px-6 py-2 text-gray-600 hover:text-gray-800 smooth-transition text-sm"
                >
                  Change Selection
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <p className="text-gray-500 text-xs text-center">
                Each reading costs 1 credit. Credits never expire.
              </p>
              <Link
                href="/credits"
                onClick={handleCloseModal}
                className="block text-center text-purple-600 hover:text-purple-700 smooth-transition text-sm font-medium"
              >
                View all purchase options →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

