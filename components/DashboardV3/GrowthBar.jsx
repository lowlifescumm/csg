"use client";
const logger = require('@/lib/logger');
import { useState, useEffect } from "react";
import { Trophy, Sparkles, Zap, Crown, Gift, Loader2, Info } from "lucide-react";

/**
 * Level perks by level
 */
const LEVEL_PERKS = {
  1: {
    title: "Spiritual Seeker",
    perks: ["Access to basic readings", "Daily horoscope", "Moon phase tracking"],
    reward: "Welcome bonus: 5 credits",
  },
  2: {
    title: "Cosmic Explorer",
    perks: ["Unlock guided readings", "Energy tracking", "Crystal recommendations"],
    reward: "Level reward: 10 credits + 1 premium reading",
  },
  3: {
    title: "Mystic Traveler",
    perks: ["Advanced tarot spreads", "Personalized insights", "Priority support"],
    reward: "Level reward: 15 credits + exclusive content",
  },
  4: {
    title: "Celestial Guide",
    perks: ["All premium features", "Birth chart deep dive", "Compatibility analysis"],
    reward: "Level reward: 20 credits + 1 month premium preview",
  },
  5: {
    title: "Cosmic Master",
    perks: ["Unlimited readings", "Early access features", "Master classes"],
    reward: "Level reward: 25 credits + lifetime benefits",
  },
};

/**
 * Get level perks (defaults to general perks for higher levels)
 */
function getLevelPerks(level) {
  if (LEVEL_PERKS[level]) {
    return LEVEL_PERKS[level];
  }
  
  // For levels beyond 5, use tiered perks
  const tier = Math.floor(level / 5);
  return {
    title: `Spiritual Master Level ${level}`,
    perks: [
      `${level * 5} credits bonus`,
      "Unlimited access to all features",
      "Exclusive monthly content",
      "Priority cosmic guidance",
    ],
    reward: `Level reward: ${level * 5} credits + special perks`,
  };
}

/**
 * GrowthBar - Spiritual Growth / XP progress bar with level rewards
 * 
 * Props:
 * - level: Current level (defaults to 1)
 * - xpCurrent: Current XP points (defaults to 0)
 * - xpTarget: XP needed to reach next level (defaults to 100)
 * - userId: User ID for claiming rewards
 * - onLevelUp: Callback when level is claimed
 */
export default function GrowthBar({
  level = 1,
  xpCurrent = 0,
  xpTarget = 100,
  userId = null,
  onLevelUp = null,
}) {
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(false);

  // Calculate if level can be claimed
  useEffect(() => {
    setCanClaim(xpCurrent >= xpTarget);
  }, [xpCurrent, xpTarget]);

  // Animate progress bar
  useEffect(() => {
    const progressPercent = Math.min((xpCurrent / xpTarget) * 100, 100);
    
    // Animate to target
    const timer = setTimeout(() => {
      setProgress(progressPercent);
    }, 100);

    return () => clearTimeout(timer);
  }, [xpCurrent, xpTarget]);

  const handleClaimReward = async () => {
    if (!userId || claiming || !canClaim) return;

    setClaiming(true);
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          level,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Call level up callback
        if (onLevelUp) {
          onLevelUp({
            level: data.newLevel || level + 1,
            rewards: data.rewards,
          });
        }
        
        // Reset canClaim state
        setCanClaim(false);
      } else {
        logger.error("Failed to claim reward:", data.error);
      }
    } catch (err) {
      logger.error("Error claiming reward:", err);
    } finally {
      setClaiming(false);
    }
  };

  const levelPerks = getLevelPerks(level);
  const xpRemaining = Math.max(xpTarget - xpCurrent, 0);
  const progressPercent = xpTarget > 0 ? Math.min((xpCurrent / xpTarget) * 100, 100) : 0;

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-violet-900">
              <span className="text-white font-bold text-sm">{level}</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-1">
              Spiritual Growth
            </h2>
            <p className="text-purple-200 text-sm sm:text-base">
              {levelPerks.title}
            </p>
          </div>
        </div>

        {/* Tooltip Toggle */}
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative p-2 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 smooth-transition border border-white border-opacity-20"
          aria-label="View level perks"
        >
          <Info className="w-5 h-5 text-purple-200" />
          
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-br from-violet-800 to-purple-800 rounded-xl p-4 apple-shadow-xl border border-white border-opacity-40 z-10">
              <h4 className="text-white font-semibold mb-2">Level {level} Perks</h4>
              <ul className="space-y-1 mb-3">
                {levelPerks.perks.map((perk, index) => (
                  <li key={index} className="text-purple-200 text-sm flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-300 flex-shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-white border-opacity-20">
                <p className="text-yellow-300 text-xs font-medium">{levelPerks.reward}</p>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-purple-200">
              {xpCurrent} / {xpTarget} XP
            </span>
          </div>
          <span className="text-sm text-purple-200">
            {xpRemaining > 0 ? `${xpRemaining} XP to next level` : "Level Complete!"}
          </span>
        </div>
        
        <div className="h-4 bg-white bg-opacity-10 rounded-full overflow-hidden border border-white border-opacity-20 relative">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 smooth-transition relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent opacity-20 animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Claim Reward Button */}
      {canClaim && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Level {level} Complete!</p>
                <p className="text-yellow-200 text-sm">{levelPerks.reward}</p>
              </div>
            </div>
            <button
              onClick={handleClaimReward}
              disabled={claiming || !userId}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>Claim Reward</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Next Level Preview */}
      {!canClaim && (
        <div className="mt-4 flex items-center gap-2 text-sm text-purple-200">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>Next level unlocks: {getLevelPerks(level + 1).title}</span>
        </div>
      )}
    </div>
  );
}

