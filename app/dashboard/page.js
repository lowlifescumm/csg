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

  const fetchReadings = async () => {
    try {
      // Fetch readings
      const res = await fetch("/api/readings");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setReadings(data.readings);
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
      }
    } catch (error) {
      console.error("Error fetching readings:", error);
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
        <svg className="animate-spin h-12 w-12 text-purple-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
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
      
      <div className="max-w-6xl mx-auto">
        <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Welcome, {user?.firstName || user?.email}!
              </h1>
              <p className="text-gray-600 mt-2">Your spiritual journey awaits</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="px-6 py-3 bg-white bg-opacity-60 text-gray-900 rounded-xl font-medium smooth-transition hover:bg-opacity-80 apple-shadow"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-gray-900 bg-opacity-80 text-white rounded-xl font-medium smooth-transition hover:bg-opacity-100 apple-shadow"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Explore Your Cosmic Journey Section */}
        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold gradient-text mb-2">Explore Your Cosmic Journey</h2>
            <p className="text-gray-600">Discover guidance through tarot, astrology, and planetary wisdom</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              🔮 Tarot Reading
            </Link>
            <Link
              href="/birth-chart"
              className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              ⭐ Birth Chart
            </Link>
            <Link
              href="/moon-reading"
              className="inline-block bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              🌙 Moon Reading
            </Link>
            <Link
              href="/compatibility"
              className="inline-block bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              💕 Compatibility
            </Link>
            <Link
              href="/transits"
              className="inline-block bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center relative"
            >
              ⚡ Transit Dashboard
              {stats.status === 'Premium' && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  Premium
                </span>
              )}
            </Link>
            <Link
              href="/subscription"
              className="inline-block bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              👑 Go Premium
            </Link>
            <Link
              href="/credits"
              className="inline-block bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              💳 Buy Credits
            </Link>
            <Link
              href="/coach"
              className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-lg text-center"
            >
              🤖 AI Coach
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Credits</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.credits}</p>
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Readings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.readingCount + stats.chartCount}</p>
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">{stats.status}</p>
              </div>
            </div>
          </div>
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
