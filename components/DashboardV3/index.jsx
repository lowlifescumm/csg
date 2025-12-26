"use client";
import { useState, useEffect } from "react";
import { Sparkles, Star, Moon, Heart, Zap, Crown, CreditCard, X, Brain, Briefcase, ChevronRight, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import HeroHeader from "./HeroHeader";
import FocusGrid from "./FocusGrid";
import CosmicBriefing from "./CosmicBriefing";
import DailyTasks from "./DailyTasks";
import EnergyChart from "./EnergyChart";
import CrystalsWidget from "./CrystalsWidget";
import GrowthBar from "./GrowthBar";
import CompactDailyStreak from "./CompactDailyStreak";
import BestMatches from "./BestMatches";
import ReadingHistory from "./ReadingHistory";
import PremiumCard from "./PremiumCard";
import InteractiveTarotSelector from "@/components/InteractiveTarotSelector";
import TarotReadingTypePicker from "@/components/TarotReadingTypePicker";
import CardCountSelector from "@/components/CardCountSelector";
import HelpSystem from "@/components/HelpSystem";
import DailyHoroscope from "@/components/DailyHoroscope";
import PatternAlert from "@/components/PatternAlert";
// Meditation components temporarily hidden
// import MeditationCard from "@/components/MeditationCard";
// import MeditationPlayer from "@/components/MeditationPlayer";
// import MeditationHistory from "@/components/MeditationHistory";

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
  // Safely extract values, ensuring we never render objects directly
  const safeCredits = credits && typeof credits === 'object' ? credits : null;
  const safeReadings = readings && typeof readings === 'object' ? readings : null;
  const safeStreak = streak && typeof streak === 'object' ? streak : null;
  const safeMoonPhase = moonPhase && typeof moonPhase === 'object' ? moonPhase : null;
  
  const isPremium = user?.stripe_subscription_id || safeCredits?.isPremium;
  // SSOT: Prioritize ledgerBalance if available, then stats.totalAvailable, then credits field
  const totalCredits = safeCredits?.ledgerBalance ?? safeCredits?.stats?.totalAvailable ?? (typeof safeCredits?.credits === 'number' ? safeCredits.credits : 0);
  
  // Helper function to check credits before opening tarot selector
  const checkCreditsAndOpenTarot = async (spreadType, readingType, readingTypeKey = null) => {
    // Determine reading type key if not provided
    if (!readingTypeKey) {
      const isPremiumTarot = spreadType === "love-potential" || spreadType === "breakup" || spreadType === "yin-yang";
      readingTypeKey = isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC';
    }
    
    try {
      const checkRes = await fetch(`/api/credits/check-reading?readingType=${readingTypeKey}`, {
        credentials: 'include'
      });
      const checkData = await checkRes.json();
      
      if (!checkData.allowed) {
        // Show error and prevent card selection
        alert(checkData.reason === 'insufficient_credits' 
          ? `Insufficient credits. This reading requires ${checkData.cost} credit(s). You have ${checkData.available_balance || 0} credit(s) available.`
          : 'Unable to start reading. Please try again.');
        return false;
      }
      
      // Credits are sufficient, open selector
      setTarotSelectorConfig({ spreadType, readingType });
      setShowTarotSelector(true);
      return true;
    } catch (error) {
      console.error('Error checking credits:', error);
      alert('Failed to check credits. Please try again.');
      return false;
    }
  };
  const readingCount = safeReadings?.stats?.readingCount || 0;
  const chartCount = safeReadings?.stats?.chartCount || 0;
  const [levelData, setLevelData] = useState({ level: 1, xpCurrent: 0, xpTarget: 100 });
  const [showTarotSelector, setShowTarotSelector] = useState(false);
  const [showTarotTypePicker, setShowTarotTypePicker] = useState(false);
  const [showCardCountSelector, setShowCardCountSelector] = useState(false);
  const [tarotSelectorConfig, setTarotSelectorConfig] = useState({ spreadType: "three-card", readingType: "general" });
  const [hasBirthChart, setHasBirthChart] = useState(null); // null = checking, true/false = result
  // Meditation state temporarily hidden
  // const [showMeditations, setShowMeditations] = useState(false);
  // const [meditations, setMeditations] = useState([]);
  // const [selectedMeditation, setSelectedMeditation] = useState(null);
  // const [meditationSessionId, setMeditationSessionId] = useState(null);
  // const [showMeditationPlayer, setShowMeditationPlayer] = useState(false);
  // const [showCompactPlayer, setShowCompactPlayer] = useState(false);

  // Check if user has a birth chart
  useEffect(() => {
    if (user?.id) {
      fetch('/api/birth-chart')
        .then(res => res.json())
        .then(data => {
          setHasBirthChart(data.hasChart || false);
        })
        .catch(() => {
          setHasBirthChart(false);
        });
    }
  }, [user?.id]);

  // Initialize level/XP immediately so GrowthBar reflects current progress even before DailyTasks loads
  useEffect(() => {
    let cancelled = false;
    async function initXP() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.success) return;
        const totalXP = data.stats?.totalXP || 0;
        const level = Math.floor(totalXP / 100) + 1;
        if (!cancelled) {
          setLevelData({
            level,
            xpCurrent: totalXP,
            xpTarget: level * 100,
          });
        }
      } catch {}
    }
    initXP();
    return () => { cancelled = true; };
  }, []);

  // Meditation functions temporarily hidden
  // useEffect(() => {
  //   if (showMeditations && meditations.length === 0) {
  //     fetch('/api/meditations')
  //       .then(res => res.json())
  //       .then(data => {
  //         if (data.success) {
  //           setMeditations(data.meditations || []);
  //         }
  //       })
  //       .catch(err => {
  //         console.error('Failed to fetch meditations:', err);
  //       });
  //   }
  // }, [showMeditations]);

  // const handleStartMeditation = async (meditation) => {
  //   try {
  //     const res = await fetch(`/api/meditations/${meditation.id}/start`, {
  //       method: 'POST',
  //     });

  //     const data = await res.json();

  //     if (res.ok && data.success) {
  //       setSelectedMeditation(meditation);
  //       setMeditationSessionId(data.sessionId);
  //       setShowMeditationPlayer(true);
  //       setShowMeditations(false);
  //     } else if (res.status === 402) {
  //       // Premium required
  //       window.location.href = '/subscription';
  //     } else {
  //       alert(data.error || 'Failed to start meditation');
  //     }
  //   } catch (error) {
  //     console.error('Error starting meditation:', error);
  //     alert('Failed to start meditation');
  //   }
  // };

  // const handleMeditationComplete = (data) => {
  //   // Refresh dashboard data
  //   if (refetch) refetch();
  //   // Show completion message
  //   alert(`Meditation complete! You earned ${data.xpAwarded} XP.`);
  //   setShowMeditationPlayer(false);
  //   setShowCompactPlayer(false);
  //   setSelectedMeditation(null);
  //   setMeditationSessionId(null);
  // };

  // Get user's sun sign for Daily Horoscope
  const [userSign, setUserSign] = useState(null);
  
  useEffect(() => {
    if (user?.id) {
      fetch('/api/birth-chart')
        .then(res => res.json())
        .then(data => {
          if (data.chart?.planets?.sun?.sign) {
            setUserSign(data.chart.planets.sun.sign);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  return (
    <div className="w-full">
      {/* Main Content - No wrapper needed, layout shell handles it */}
      <div className="space-y-8">
          {/* Hero Header */}
          <HeroHeader
            user={user}
            credits={safeCredits}
            streak={safeStreak}
            moonPhase={safeMoonPhase}
          />

          {/* Why Us - Value Proposition */}
          <div className="glassmorphic rounded-3xl p-4 sm:p-6 md:p-8 apple-shadow-lg border border-white border-opacity-40 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-3">Why Choose Cosmic Spiritual Guide?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3 sm:mb-4 apple-shadow-lg">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Precision</h3>
                <p className="text-purple-200 text-sm sm:text-base leading-relaxed">NASA-quality astrological calculations powered by advanced astronomy algorithms</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-3 sm:mb-4 apple-shadow-lg">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Clarity</h3>
                <p className="text-purple-200 text-sm sm:text-base leading-relaxed">AI-powered interpretations that make complex astrological insights accessible and actionable</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3 sm:mb-4 apple-shadow-lg">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Free Daily Credits</h3>
                <p className="text-purple-200 text-sm sm:text-base leading-relaxed">3 credits refresh every day - explore tarot readings without spending a dime</p>
              </div>
            </div>
          </div>

          {/* Section A: Daily Guidance (Quick/Free Zone) */}
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Daily Guidance</h2>
              <p className="text-purple-200 text-sm sm:text-base">Quick access to your daily cosmic insights - perfect for starting your day</p>
            </div>

            {/* Daily Horoscope */}
            <div className="mb-6">
              <DailyHoroscope userSign={userSign} />
            </div>

            {/* Quick Tarot Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => checkCreditsAndOpenTarot("daily", "daily")}
                className="group bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg flex items-center justify-center gap-3 relative"
              >
                <Sparkles className="w-5 h-5 group-hover:animate-bounce-gentle" />
                <span>Daily Tarot</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">1 Credit</span>
              </button>
              <button
                onClick={() => checkCreditsAndOpenTarot("daily-love", "daily-love")}
                className="group bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white px-6 py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg flex items-center justify-center gap-3 relative"
              >
                <Heart className="w-5 h-5" />
                <span>Love Tarot</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">1 Credit</span>
              </button>
              <button
                onClick={() => checkCreditsAndOpenTarot("career", "career")}
                className="group bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-6 py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg flex items-center justify-center gap-3 relative"
              >
                <Briefcase className="w-5 h-5" />
                <span>Career Tarot</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">1 Credit</span>
              </button>
            </div>

            {/* Compact Daily Streak Widget */}
            <div className="mt-6">
              <CompactDailyStreak userId={user?.id} streak={safeStreak} />
            </div>
          </div>

          {/* Section B: Deep Dive Insights (Pay-per-use Zone) */}
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Deep Dive Insights</h2>
              <p className="text-purple-200 text-sm sm:text-base">Comprehensive readings and analyses to deepen your spiritual understanding</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Birth Chart */}
              <Link
                href={hasBirthChart === true ? "/my-chart" : "/birth-chart"}
                className="group bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-3 relative"
              >
                <Star className="w-8 h-8" />
                <span>{hasBirthChart === true ? "My Birth Chart" : "Create Chart (Free)"}</span>
                {hasBirthChart === false && (
                  <span className="absolute top-2 right-2 bg-green-500/80 text-xs px-2 py-1 rounded-full">Free</span>
                )}
                {hasBirthChart === true && (
                  <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">View</span>
                )}
              </Link>

              {/* Compatibility Report */}
              <Link
                href="/compatibility"
                className="group bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-3 relative"
              >
                <Heart className="w-8 h-8" />
                <span>Compatibility Report</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">5 Credits</span>
              </Link>

              {/* Moon Reading */}
              <Link
                href="/moon-reading"
                className="group bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-3 relative"
              >
                <Moon className="w-8 h-8" />
                <span>Moon Reading</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">2 Credits</span>
              </Link>

              {/* Breakup Tarot */}
              <button
                onClick={() => checkCreditsAndOpenTarot("breakup", "breakup", "TAROT_PREMIUM")}
                className="group bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-3 relative"
              >
                <Heart className="w-8 h-8" />
                <span>Breakup Tarot</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">1 Credit</span>
              </button>

              {/* Past Present Future */}
              <button
                onClick={() => checkCreditsAndOpenTarot("ppf", "ppf")}
                className="group bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-3 relative"
              >
                <Sparkles className="w-8 h-8" />
                <span>Past Present Future</span>
                <span className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">2 Credits</span>
              </button>

              {/* All Tarot Types Button */}
              <button
                onClick={() => {
                  setShowTarotTypePicker(true);
                }}
                className="group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-6 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-3 border-2 border-white border-opacity-30"
              >
                <Sparkles className="w-8 h-8" />
                <span>More Tarot Types</span>
                <span className="text-xs opacity-80">View All</span>
              </button>
            </div>

            {/* Pattern Alert - Cosmic Insights */}
            <div className="mt-6">
              <PatternAlert />
            </div>
          </div>

          {/* Section C: Cosmic Intelligence (Premium Dashboard) */}
          <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-pink-500/10 relative overflow-hidden">
            {/* Premium Badge */}
            <div className="absolute top-4 right-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Crown className="w-4 h-4" />
                PREMIUM
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold gradient-text">Cosmic Intelligence</h2>
                  <p className="text-purple-200 text-sm sm:text-base">Advanced planetary analysis and AI-powered insights</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transit Dashboard */}
              <Link
                href={isPremium ? "/transits" : "/subscription"}
                className="group bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white p-8 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      {!isPremium ? (
                        <Lock className="w-8 h-8" />
                      ) : (
                        <Zap className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        Transit Dashboard
                        {!isPremium && <span className="text-sm bg-yellow-400/30 px-2 py-1 rounded-full">Premium</span>}
                      </h3>
                      <p className="text-white/80 text-sm">Real-time planetary transits</p>
                    </div>
                  </div>
                  <p className="text-white/90 mb-4">
                    Track active planetary transits affecting your birth chart with AI-powered interpretations and personalized guidance.
                  </p>
                  <div className="flex items-center gap-2 text-yellow-300">
                    <span className="text-sm font-semibold">{isPremium ? "View Dashboard" : "Upgrade to Access"}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* AI Interpretations Info */}
              <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">AI Interpretations</h3>
                    <p className="text-purple-200 text-sm">Powered by GPT-4o-mini</p>
                  </div>
                </div>
                <p className="text-white/90 mb-4">
                  Get detailed, personalized interpretations of your readings, transits, and astrological insights enhanced by advanced AI.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-semibold rounded-full">Priority Processing</span>
                  <span className="px-3 py-1 bg-pink-500/30 text-pink-200 text-xs font-semibold rounded-full">Enhanced Detail</span>
                  <span className="px-3 py-1 bg-orange-500/30 text-orange-200 text-xs font-semibold rounded-full">Personalized</span>
                </div>
              </div>
            </div>

            {!isPremium && (
              <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-400/50 rounded-xl">
                <p className="text-yellow-200 text-sm text-center mb-3">
                  <strong>Premium Feature:</strong> Unlock unlimited access to Transit Dashboard and priority AI interpretations
                </p>
                <Link
                  href="/subscription"
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition"
                >
                  Upgrade to Premium
                </Link>
              </div>
            )}
          </div>

          {/* Compact Daily Streak - Replaces GrowthBar + DailyTasks for space saving */}
          {/* Note: Full DailyTasks component removed from main view, can be accessed via CompactDailyStreak if needed */}

          {/* Energy Chart */}
          <EnergyChart 
            userId={user?.id}
          />

          {/* Crystals Widget */}
          <CrystalsWidget 
            moonPhase={safeMoonPhase}
          />

          {/* Best Matches */}
          <BestMatches 
            userId={user?.id}
          />

          {/* Reading History */}
          <ReadingHistory 
            userId={user?.id}
            onReadingSelect={(reading) => {
              // Optionally refresh readings after selection
              if (refetch) refetch();
            }}
          />

          {/* Premium Card */}
          <PremiumCard 
            isPremium={isPremium}
            variant="auto"
            onUpgrade={() => {
              // Optional: track upgrade click
              console.log("Premium upgrade initiated");
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

            {safeStreak && safeStreak.currentStreak > 0 && (
              <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow border border-white border-opacity-40 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-purple-200 font-medium">Streak</p>
                    <p className="text-xl sm:text-2xl font-semibold text-white truncate">{safeStreak.currentStreak} days</p>
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

        {/* Tarot Reading Type Picker Modal */}
        {showTarotTypePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
            <div className="glassmorphic rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-5xl w-full max-h-[95vh] overflow-y-auto apple-shadow-lg border border-white border-opacity-40 my-4">
              <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold gradient-text mb-1 sm:mb-2">Choose Your Tarot Reading</h2>
                  <p className="text-purple-200 text-xs sm:text-sm md:text-base">Select a reading type to begin your journey</p>
                </div>
                <button
                  onClick={() => setShowTarotTypePicker(false)}
                  className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
              <TarotReadingTypePicker
                onPick={async (type) => {
                  // Determine reading type key for credit check
                  const isPremiumTarot = type.spreadType === "love-potential" || type.spreadType === "breakup" || type.spreadType === "yin-yang";
                  const readingTypeKey = isPremiumTarot ? 'TAROT_PREMIUM' : 'TAROT_BASIC';
                  
                  // Check credits before opening card selector
                  try {
                    const checkRes = await fetch(`/api/credits/check-reading?readingType=${readingTypeKey}`, {
                      credentials: 'include'
                    });
                    const checkData = await checkRes.json();
                    
                    if (!checkData.allowed) {
                      // Show error and prevent card selection
                      alert(checkData.reason === 'insufficient_credits' 
                        ? `Insufficient credits. This reading requires ${checkData.cost} credit(s). You have ${checkData.available_balance || 0} credit(s) available.`
                        : 'Unable to start reading. Please try again.');
                      return;
                    }
                    
                    // Credits are sufficient, proceed
                    if (type.isCustom) {
                      // Show card count selector for custom spread
                      setShowTarotTypePicker(false);
                      setShowCardCountSelector(true);
                    } else {
                      setTarotSelectorConfig({ spreadType: type.spreadType, readingType: type.key });
                      setShowTarotTypePicker(false);
                      setShowTarotSelector(true);
                    }
                  } catch (error) {
                    console.error('Error checking credits:', error);
                    alert('Failed to check credits. Please try again.');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Card Count Selector Modal */}
        {showCardCountSelector && (
          <CardCountSelector
            onSelect={async (config) => {
              // Credit check is already done in CardCountSelector.handleSubmit
              // Just open the tarot selector
              setTarotSelectorConfig({ 
                spreadType: config.spreadType, 
                readingType: "general",
                cardCount: config.cardCount,
                question: config.question,
                spreadId: config.spreadId
              });
              setShowCardCountSelector(false);
              setShowTarotSelector(true);
            }}
            onCancel={() => {
              setShowCardCountSelector(false);
            }}
          />
        )}

        {/* Interactive Tarot Selector Modal */}
        {showTarotSelector && (
          <InteractiveTarotSelector
            spreadType={tarotSelectorConfig.spreadType}
            readingType={tarotSelectorConfig.readingType}
            cardCount={tarotSelectorConfig.cardCount}
            question={tarotSelectorConfig.question}
            spreadId={tarotSelectorConfig.spreadId}
            onClose={() => {
              setShowTarotSelector(false);
              if (refetch) refetch();
            }}
            onComplete={(reading) => {
              setShowTarotSelector(false);
              if (refetch) refetch();
            }}
          />
        )}

        {/* Meditations Modal - Temporarily hidden */}
        {/* {showMeditations && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="glassmorphic rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto apple-shadow-lg border border-white border-opacity-40">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Choose Your Meditation</h2>
                  <p className="text-purple-200 text-sm sm:text-base">Select a guided meditation to begin</p>
                </div>
                <button
                  onClick={() => setShowMeditations(false)}
                  className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition"
                  aria-label="Close meditations"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {meditations.map((meditation) => (
                  <MeditationCard
                    key={meditation.id}
                    meditation={meditation}
                    isPremium={isPremium}
                    onStart={handleStartMeditation}
                  />
                ))}
              </div>
            </div>
          </div>
        )} */}

        {/* Meditation Player Modal - Temporarily hidden */}
        {/* {showMeditationPlayer && selectedMeditation && meditationSessionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="max-w-3xl w-full">
              <MeditationPlayer
                meditation={selectedMeditation}
                sessionId={meditationSessionId}
                onComplete={handleMeditationComplete}
                onClose={() => {
                  setShowMeditationPlayer(false);
                  setShowCompactPlayer(true);
                }}
                compact={false}
              />
            </div>
          </div>
        )} */}

        {/* Compact Floating Player - Temporarily hidden */}
        {/* {showCompactPlayer && selectedMeditation && meditationSessionId && (
          <MeditationPlayer
            meditation={selectedMeditation}
            sessionId={meditationSessionId}
            onComplete={handleMeditationComplete}
            onClose={() => {
              setShowCompactPlayer(false);
              setSelectedMeditation(null);
              setMeditationSessionId(null);
            }}
            compact={true}
          />
        )} */}

        {/* Help System */}
        <HelpSystem />
    </div>
  );
}

