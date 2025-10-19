"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import TarotReadingTypePicker from "@/components/TarotReadingTypePicker";
import DailyHoroscope from "@/components/DailyHoroscope";
import MoonPhaseWidget from "@/components/MoonPhaseWidget";
import CreditManagementWidget from "@/components/CreditManagementWidget";
import LowCreditsUpsellBanner from "@/components/LowCreditsUpsellBanner";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// Dynamically import to avoid SSR issues with Next.js Image component
const InteractiveTarotSelector = dynamic(
  () => import("@/components/InteractiveTarotSelector"),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ credits: 0, readingCount: 0, chartCount: 0, status: "Free" });
  const [readings, setReadings] = useState({ tarot: [], birthCharts: [] });
  const [loading, setLoading] = useState(true);
  const [totalCredits, setTotalCredits] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showTarotSelector, setShowTarotSelector] = useState(false);
  const [tarotConfig, setTarotConfig] = useState({ spreadType: "three-card", readingType: "general" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
        fetchReadings();
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      setError(null);
      
      // Fetch readings
      const res = await fetch("/api/readings");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setReadings(data.readings);
      } else {
        setError("Failed to load readings. Please try again.");
      }
      
      // Fetch credit data
      const creditRes = await fetch("/api/credits");
      const creditData = await creditRes.json();
      if (creditRes.ok) {
        setIsPremium(creditData.isPremium);
        if (creditData.isPremium && creditData.stats) {
          setTotalCredits(creditData.stats.totalAvailable);
        } else {
          setTotalCredits(0);
        }
      } else {
        setError("Failed to load credit information.");
      }
    } catch (error) {
      console.error("Error fetching readings:", error);
      setError("Unable to connect to the server. Please check your internet connection.");
    } finally {
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 animate-pulse mb-4">Loading your cosmic journey...</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Enhanced Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔮</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cosmic Spiritual Guide</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Discover clarity through ancient wisdom</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard" className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                Dashboard
              </Link>
              <Link href="/birth-chart" className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                Birth Chart
              </Link>
              <Link href="/compatibility" className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                Compatibility
              </Link>
              <Link href="/profile" className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                Profile
              </Link>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-sm text-gray-600">
                Welcome, {user?.firstName || user?.email}!
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-slide-up">
            <div className="glassmorphic rounded-2xl p-4 border border-red-200 bg-red-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-red-500">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 smooth-transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 animate-slide-up">
            <div className="glassmorphic rounded-2xl p-4 border border-green-200 bg-green-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 text-green-500">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-500 hover:text-green-700 smooth-transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => fetchReadings(true)}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {/* Show upsell banner for premium users with low credits or free users */}
        {(isPremium && totalCredits !== null && totalCredits < 3) && (
          <LowCreditsUpsellBanner 
            currentCredits={totalCredits} 
            creditsNeeded={3}
          />
        )}
        {(!isPremium && totalCredits === 0) && (
          <LowCreditsUpsellBanner 
            currentCredits={0} 
            creditsNeeded={1}
            forceShow={true}
          />
        )}
        
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section - Mobile Optimized */}
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  Welcome back, {user?.firstName || user?.email}!
                </h1>
                <p className="text-gray-600 mt-2">Your spiritual journey continues</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/profile"
                  className="px-6 py-3 bg-white bg-opacity-60 text-gray-900 rounded-xl font-medium smooth-transition hover:bg-opacity-80 apple-shadow text-center"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>

        {/* Explore Your Cosmic Journey Section - Enhanced Mobile Design */}
        <div className="glassmorphic rounded-3xl p-6 sm:p-10 apple-shadow-lg border border-white border-opacity-40 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Explore Your Cosmic Journey</h2>
            <p className="text-gray-600 text-sm sm:text-base">Discover guidance through tarot, astrology, and planetary wisdom</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <Link
              href="/"
              className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center overflow-hidden"
              aria-label="Get a tarot reading"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 smooth-transition"></div>
              <div className="relative flex flex-col items-center space-y-1 z-10">
                <span className="text-2xl group-hover:animate-bounce-gentle">🔮</span>
                <span className="group-hover:translate-y-[-2px] smooth-transition">Tarot Reading</span>
              </div>
            </Link>
            <Link
              href="/birth-chart"
              className="group relative bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="Create your birth chart"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">⭐</span>
                <span>Birth Chart</span>
              </div>
            </Link>
            <Link
              href="/moon-reading"
              className="group relative bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="Get a personalized moon reading"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">🌙</span>
                <span>Moon Reading</span>
              </div>
            </Link>
            <Link
              href="/compatibility"
              className="group relative bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="Check relationship compatibility"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">💕</span>
                <span>Compatibility</span>
              </div>
            </Link>
            <Link
              href="/transits"
              className="group relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="View planetary transits"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">⚡</span>
                <span>Transit Dashboard</span>
                {stats.status === 'Premium' && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    Premium
                  </span>
                )}
              </div>
            </Link>
            <Link
              href="/subscription"
              className="group relative bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="Upgrade to premium subscription"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">👑</span>
                <span>Go Premium</span>
              </div>
            </Link>
            <Link
              href="/credits"
              className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="Purchase credits"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">💳</span>
                <span>Buy Credits</span>
              </div>
            </Link>
            <Link
              href="/coach"
              className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
              aria-label="Get AI coaching guidance"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">🤖</span>
                <span>AI Coach</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Section - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {isRefreshing ? (
            <LoadingSkeleton type="card" count={3} />
          ) : (
            <>
              <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Credits</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{stats.credits}</p>
                  </div>
                </div>
              </div>

              <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Readings</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{stats.readingCount + stats.chartCount}</p>
                  </div>
                </div>
              </div>

              <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Status</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{stats.status}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <DailyHoroscope />
          </div>
          <div className="flex items-center justify-center">
            <MoonPhaseWidget />
          </div>
          <div>
            <CreditManagementWidget />
          </div>
        </div>

        {/* Daily Tarot Reading Section */}
        <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold gradient-text">Daily Tarot Reading</h3>
                  <p className="text-gray-600">Discover guidance through the wisdom of the cards</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Select three cards from the mystical deck to reveal insights about your past, present, and future. 
                Let the universe guide you through today's journey.
              </p>
            </div>
            <button
              onClick={() => setShowTarotSelector(true)}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg whitespace-nowrap"
            >
              Get Your Reading
            </button>
          </div>
          <div className="mt-6">
            <TarotReadingTypePicker onPick={(t)=> setTarotConfig({ spreadType: t.spreadType, readingType: t.key })} />
          </div>
        </div>

        {(readings.tarot.length > 0 || readings.birthCharts.length > 0) && (
          <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
            <h2 className="text-2xl font-semibold gradient-text mb-6">Your Reading History</h2>
            
            {readings.tarot.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarot Readings</h3>
                <div className="space-y-3">
                  {readings.tarot.slice(0, 5).map((reading) => (
                    <div 
                      key={reading.id}
                      className="bg-white bg-opacity-40 rounded-xl p-4 apple-shadow border border-white border-opacity-60 smooth-transition hover:bg-opacity-60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{formatDate(reading.created_at)}</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            {reading.result.spreadType || 'Three Card'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">{reading.question}</p>
                      {reading.result.cards && (
                        <div className="flex gap-1 mb-2">
                          {reading.result.cards.slice(0, 3).map((card, idx) => (
                            <div key={idx} className="text-xs text-gray-600 bg-white bg-opacity-50 px-2 py-1 rounded">
                              {card.name}
                            </div>
                          ))}
                          {reading.result.cards.length > 3 && (
                            <div className="text-xs text-gray-500 px-2 py-1">
                              +{reading.result.cards.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {readings.tarot.length > 5 && (
                    <div className="text-center">
                      <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                        View {readings.tarot.length - 5} more readings
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {readings.birthCharts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Birth Charts</h3>
                <div className="space-y-3">
                  {readings.birthCharts.slice(0, 3).map((chart) => (
                    <div 
                      key={chart.id}
                      className="bg-white bg-opacity-40 rounded-xl p-4 apple-shadow border border-white border-opacity-60 smooth-transition hover:bg-opacity-60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{formatDate(chart.created_at)}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            Birth Chart
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2">{chart.location}</p>
                      <p className="text-xs text-gray-600">Born: {new Date(chart.birth_date).toLocaleDateString()} at {chart.birth_time}</p>
                    </div>
                  ))}
                  {readings.birthCharts.length > 3 && (
                    <div className="text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View {readings.birthCharts.length - 3} more charts
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Tarot Selector Modal */}
      {showTarotSelector && (
        <InteractiveTarotSelector 
          onClose={() => setShowTarotSelector(false)}
          spreadType={tarotConfig.spreadType}
          readingType={tarotConfig.readingType}
          onComplete={(reading) => {
            setShowTarotSelector(false);
            // Optionally refresh readings to show the new one in history
            fetchReadings();
          }}
        />
      )}
    </div>
  );
}
