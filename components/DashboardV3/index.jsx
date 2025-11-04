"use client";
import { Sparkles, Star, Moon, Heart, Zap, Crown, CreditCard } from "lucide-react";
import Link from "next/link";
import HeroHeader from "./HeroHeader";
import FocusGrid from "./FocusGrid";
import CosmicBriefing from "./CosmicBriefing";

/**
 * DashboardV3 - New dashboard component with cosmic brand styling
 * 
 * Features:
 * - Deep violet gradient background
 * - Soft card shadows
 * - Modern, sleek Apple-inspired design
 * - Component-based architecture for easy feature toggling
 */
export default function DashboardV3({ user, credits, readings, streak, moonPhase, refetch }) {
  const isPremium = user?.stripe_subscription_id || credits?.isPremium;
  const totalCredits = credits?.stats?.totalAvailable || credits?.credits || 0;
  const readingCount = readings?.stats?.readingCount || 0;
  const chartCount = readings?.stats?.chartCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      {/* Main Content */}
      <div className="p-8 sm:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <HeroHeader 
            user={user}
            credits={credits}
            streak={streak}
            moonPhase={moonPhase}
          />

          {/* Focus Grid */}
          <FocusGrid 
            userId={user?.id}
            onReadingComplete={(reading) => {
              // Refresh readings after completion
              if (refetch) refetch();
            }}
          />

          {/* Cosmic Briefing */}
          <CosmicBriefing 
            userId={user?.id}
            onReadingComplete={(reading) => {
              // Refresh readings after completion
              if (refetch) refetch();
            }}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-purple-200 font-medium">Credits</p>
                  <p className="text-xl sm:text-2xl font-semibold text-white truncate">{totalCredits}</p>
                </div>
              </div>
            </div>

            <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-purple-200 font-medium">Readings</p>
                  <p className="text-xl sm:text-2xl font-semibold text-white truncate">{readingCount + chartCount}</p>
                </div>
              </div>
            </div>

            {streak && streak.currentStreak > 0 && (
              <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-purple-200 font-medium">Streak</p>
                    <p className="text-xl sm:text-2xl font-semibold text-white truncate">{streak.currentStreak} days</p>
                  </div>
                </div>
              </div>
            )}

            <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-purple-200 font-medium">Status</p>
                  <p className="text-xl sm:text-2xl font-semibold text-white truncate">
                    {isPremium ? "Premium" : "Free"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glassmorphic rounded-3xl p-6 sm:p-10 apple-shadow-lg border border-white border-opacity-40 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Explore Your Cosmic Journey</h2>
              <p className="text-purple-200 text-sm sm:text-base">Discover guidance through tarot, astrology, and planetary wisdom</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <Link
                href="/dashboard#tarot-section"
                className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[60px] flex items-center justify-center"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Sparkles className="w-6 h-6 group-hover:animate-bounce-gentle" />
                  <span>Tarot Reading</span>
                </div>
              </Link>
              <Link
                href="/birth-chart"
                className="group relative bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[60px] flex items-center justify-center"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Star className="w-6 h-6" />
                  <span>Birth Chart</span>
                </div>
              </Link>
              <Link
                href="/moon-reading"
                className="group relative bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[60px] flex items-center justify-center"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Moon className="w-6 h-6" />
                  <span>Moon Reading</span>
                </div>
              </Link>
              <Link
                href="/compatibility"
                className="group relative bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[60px] flex items-center justify-center"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Heart className="w-6 h-6" />
                  <span>Compatibility</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Premium Banner */}
          {!isPremium && (
            <div className="glassmorphic rounded-2xl p-6 mb-8 border border-yellow-400/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 apple-shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Unlock Premium Features</h3>
                    <p className="text-sm text-purple-200">Access unlimited readings and exclusive features</p>
                  </div>
                </div>
                <Link
                  href="/subscription"
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition apple-shadow"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}

          {/* Reading History Preview */}
          {readings && (readings.readings?.tarot?.length > 0 || readings.readings?.birthCharts?.length > 0) && (
            <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40">
              <h2 className="text-2xl font-semibold gradient-text mb-6">Recent Readings</h2>
              <div className="space-y-3">
                {[...(readings.readings.tarot || []), ...(readings.readings.birthCharts || [])]
                  .slice(0, 5)
                  .map((reading) => (
                    <div
                      key={reading.id}
                      className="bg-white bg-opacity-10 rounded-xl p-4 apple-shadow border border-white border-opacity-20 hover:bg-opacity-20 smooth-transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-200">
                          {new Date(reading.created_at).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/30 text-white">
                          {reading.type === "tarot" ? "Tarot" : "Birth Chart"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {reading.question || "Reading"}
                      </p>
                    </div>
                  ))}
              </div>
              {readings.readings.tarot.length + readings.readings.birthCharts.length > 5 && (
                <div className="text-center mt-6">
                  <Link
                    href="/dashboard"
                    className="btn-secondary"
                  >
                    View All Readings
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

