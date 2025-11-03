"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Sparkles, 
  Star, 
  Moon, 
  Heart, 
  Zap, 
  Crown, 
  CreditCard, 
  Brain, 
  FileText 
} from "lucide-react";
import TarotReadingTypePicker from "@/components/TarotReadingTypePicker";
import DailyHoroscope from "@/components/DailyHoroscope";
import MoonPhaseWidget from "@/components/MoonPhaseWidget";
import CreditManagementWidget from "@/components/CreditManagementWidget";
import LowCreditsUpsellBanner from "@/components/LowCreditsUpsellBanner";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LazyComponent from "@/components/LazyComponent";
import HelpSystem from "@/components/HelpSystem";
import DashboardShell from "@/components/DashboardShell";
import DashboardV3 from "@/components/DashboardV3/index";

// Dynamically import to avoid SSR issues with Next.js Image component
const InteractiveTarotSelector = dynamic(
  () => import("@/components/InteractiveTarotSelector"),
  { ssr: false }
);

/**
 * DashboardPage - Main dashboard route with feature flag support
 * 
 * Feature Flag: DASHBOARD_V2 (or NEXT_PUBLIC_DASHBOARD_V2)
 * - When enabled: Renders DashboardV3 with new design
 * - When disabled: Renders existing DashboardPageContent
 * 
 * To enable: Set NEXT_PUBLIC_DASHBOARD_V2=true in your .env.local file
 */
export default function DashboardPage() {
  const [isV2Enabled, setIsV2Enabled] = useState(false);

  useEffect(() => {
    // Check for feature flag via environment variable or URL parameter
    const envFlag = process.env.NEXT_PUBLIC_DASHBOARD_V2 === 'true';
    const urlFlag = typeof window !== 'undefined' && window.location.search.includes('dashboard_v2=true');
    setIsV2Enabled(envFlag || urlFlag);
  }, []);

  // If feature flag is enabled, render new dashboard
  if (isV2Enabled) {
    return (
      <DashboardShell>
        {({ user, credits, readings, streak, refetch }) => (
          <DashboardV3 
            user={user}
            credits={credits}
            readings={readings}
            streak={streak}
            refetch={refetch}
          />
        )}
      </DashboardShell>
    );
  }

  // Otherwise, render existing dashboard
  return <DashboardPageContent />;
}

function DashboardPageContent() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedReading, setExpandedReading] = useState(null);

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

  // Filter and sort readings
  const getFilteredReadings = () => {
    // Safely merge arrays and filter out any undefined/null values
    let filtered = [
      ...(readings.tarot || []), 
      ...(readings.birthCharts || [])
    ].filter(reading => reading != null);
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(reading => 
        filterType === "tarot" ? reading.type === "tarot" : reading.type === "birth_chart"
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(reading => 
        reading.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reading.result?.interpretation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort readings
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });
    
    return filtered;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSortBy("newest");
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
      {/* Main Content */}
      <div className="p-8 sm:p-10">
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
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-6" data-tour="welcome">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-tour="action-buttons">
              <button
                onClick={() => {
                  const tarotSection = document.getElementById('tarot-section');
                  if (tarotSection) {
                    tarotSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center overflow-hidden"
                aria-label="Scroll to tarot reading section"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 smooth-transition"></div>
                                  <div className="relative flex flex-col items-center space-y-1 z-10">
                    <Sparkles className="w-6 h-6 group-hover:animate-bounce-gentle" />
                    <span className="group-hover:translate-y-[-2px] smooth-transition">Tarot Reading</span>
                  </div>
              </button>
              <Link
                href="/birth-chart"
                className="group relative bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="Create your birth chart"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Star className="w-6 h-6" />
                  <span>Birth Chart</span>
                </div>
              </Link>
              <Link
                href="/moon-reading"
                className="group relative bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="Get a personalized moon reading"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Moon className="w-6 h-6" />
                  <span>Moon Reading</span>
                </div>
              </Link>
              <Link
                href="/compatibility"
                className="group relative bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="Check relationship compatibility"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Heart className="w-6 h-6" />
                  <span>Compatibility</span>
                </div>
              </Link>
              <Link
                href="/transits"
                className="group relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="View planetary transits"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Zap className="w-6 h-6" />
                  <span>Transit Dashboard</span>
                  {stats.status === 'Premium' && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
              </Link>
              <Link
                href="/forecasts"
                className="group relative bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="View personalized forecasts"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Sparkles className="w-6 h-6" />
                  <span>Daily Forecasts</span>
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
                  <Crown className="w-6 h-6" />
                  <span>Go Premium</span>
                </div>
              </Link>
              <Link
                href="/credits"
                className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="Purchase credits"
              >
                <div className="flex flex-col items-center space-y-1">
                  <CreditCard className="w-6 h-6" />
                  <span>Buy Credits</span>
                </div>
              </Link>
              <Link
                href="/coach"
                className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="Get AI coaching guidance - Premium Feature"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Brain className="w-6 h-6" />
                  <span>AI Coach</span>
                  {stats.status === 'Premium' && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
              </Link>
              <Link
                href="/blog"
                className="group relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-base sm:text-lg text-center min-h-[60px] flex items-center justify-center"
                aria-label="Read spiritual blog articles"
              >
                <div className="flex flex-col items-center space-y-1">
                  <FileText className="w-6 h-6" />
                  <span>Blog</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Premium Services Promotion Banner */}
          {stats.status !== 'Premium' && (
            <div className="glassmorphic rounded-2xl p-6 mb-8 border border-yellow-400/30 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 apple-shadow-lg animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Unlock Premium Features</h3>
                    <p className="text-sm text-gray-600">Access AI Coach and Transit Dashboard with unlimited readings</p>
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

          {/* Enhanced Stats Section - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8" data-tour="stats">
            {isRefreshing ? (
              <LoadingSkeleton type="card" count={3} />
            ) : (
              <>
                <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow animate-fade-in">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                      <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" data-tour="widgets">
            <LazyComponent fallback={<LoadingSkeleton type="card" />}>
              <DailyHoroscope />
            </LazyComponent>
            <LazyComponent fallback={<LoadingSkeleton type="card" />}>
              <div className="flex items-center justify-center">
                <MoonPhaseWidget />
              </div>
            </LazyComponent>
            <LazyComponent fallback={<LoadingSkeleton type="card" />}>
              <CreditManagementWidget />
            </LazyComponent>
          </div>

          {/* Daily Tarot Reading Section */}
          <div id="tarot-section" className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 mb-8" data-tour="tarot-section">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
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

          {/* Reading History Section - Always show for tour */}
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8" data-tour="history">
            {(readings.tarot.length > 0 || readings.birthCharts.length > 0) ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-semibold gradient-text">Your Reading History</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">
                      {getFilteredReadings().length} reading{getFilteredReadings().length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search readings..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent smooth-transition"
                        />
                      </div>
                    </div>

                    {/* Filter Dropdown */}
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent smooth-transition"
                    >
                      <option value="all">All Readings</option>
                      <option value="tarot">Tarot Only</option>
                      <option value="birth_chart">Birth Charts Only</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent smooth-transition"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>

                    {/* Clear Filters */}
                    {(searchQuery || filterType !== "all" || sortBy !== "newest") && (
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 smooth-transition"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Reading List */}
                <div className="space-y-3">
                  {getFilteredReadings().length > 0 ? (
                    getFilteredReadings().slice(0, 10).map((reading, index) => {
                      // Safety check - skip if reading is invalid
                      if (!reading || !reading.id || typeof reading !== 'object') return null;
                      
                      // Ensure type is defined and is a string
                      const readingType = (reading.type && typeof reading.type === 'string') ? reading.type : 'unknown';
                      
                      return (
                      <div 
                        key={reading.id}
                        onClick={() => setExpandedReading(reading)}
                        className="bg-white bg-opacity-40 rounded-xl p-4 apple-shadow border border-white border-opacity-60 smooth-transition hover:bg-opacity-60 hover:shadow-lg animate-fade-in cursor-pointer"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{reading.created_at ? formatDate(reading.created_at) : 'Unknown date'}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              readingType === 'tarot' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {readingType === 'tarot' 
                                ? (reading.result?.spreadType || 'Three Card')
                                : 'Birth Chart'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 capitalize">
                              {readingType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">
                          {reading.question || 'No question provided'}
                        </p>
                        {reading.result?.cards && Array.isArray(reading.result.cards) && (
                          <div className="flex gap-1 mb-2">
                            {reading.result.cards.slice(0, 3).map((card, idx) => (
                              <div key={idx} className="text-xs text-gray-600 bg-white bg-opacity-50 px-2 py-1 rounded">
                                {card?.name || 'Card'}
                              </div>
                            ))}
                            {reading.result.cards.length > 3 && (
                              <div className="text-xs text-gray-500 px-2 py-1">
                                +{reading.result.cards.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                        {reading.result?.interpretation && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {reading.result.interpretation}
                          </p>
                        )}
                      </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 10-8 8 7.962 7.962 0 01-2.291-.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-2">No readings found</p>
                      <p className="text-sm text-gray-400">
                        {searchQuery || filterType !== "all" 
                          ? "Try adjusting your search or filters" 
                          : "Start by getting your first reading!"
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Show More Button */}
                {getFilteredReadings().length > 10 && (
                  <div className="text-center mt-6">
                    <button className="btn-secondary">
                      View All {getFilteredReadings().length} Readings
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 10-8 8 7.962 7.962 0 01-2.291-.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Reading History</h3>
                <p className="text-gray-600 mb-4">Start your spiritual journey by getting your first reading!</p>
                <p className="text-sm text-gray-500">All your past readings will appear here for easy access and reflection.</p>
              </div>
            )}
          </div>

        </div>

        {/* Expanded Reading Modal */}
        {expandedReading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setExpandedReading(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold gradient-text mb-1">{expandedReading.question || 'Your Reading'}</h2>
                    <p className="text-sm text-gray-500">{expandedReading.created_at ? formatDate(expandedReading.created_at) : ''}</p>
                  </div>
                  <button 
                    onClick={() => setExpandedReading(null)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tarot Cards */}
                {expandedReading.result?.cards && expandedReading.result.cards.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Cards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {expandedReading.result.cards.map((card, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4">
                          <div className="relative overflow-hidden rounded-lg bg-white mb-3">
                            <img 
                              src={card.image} 
                              alt={card.name}
                              className={`w-full h-auto ${card.reversed ? 'rotate-180' : ''}`}
                            />
                            {card.reversed && (
                              <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                Reversed
                              </div>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 text-center mb-1">{card.name}</h4>
                          {card.position && (
                            <p className="text-xs text-purple-600 text-center font-medium uppercase">{card.position}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interpretation */}
                {expandedReading.result?.interpretation && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Interpretation</h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {expandedReading.result.interpretation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help System */}
        <HelpSystem />

        {/* Quick Tour */}
        

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
    </div>
  );
}


