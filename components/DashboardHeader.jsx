"use client";
import { useState, useEffect } from "react";
import { Moon, Sun, Heart, Gift, TrendingUp } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function DashboardHeader({ 
  user, 
  moonPhase, 
  streak, 
  credits,
  energy = 75,
  energyChange = 12,
  level = 5,
  xpCurrent = 2450,
  xpTarget = 3000
}) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(null);
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentDate(now);
    
    // Trigger progress bar animation after mount
    setTimeout(() => {
      setAnimateProgress(true);
    }, 100);
  }, []);

  const getGreeting = () => {
    if (!mounted) return "Welcome";
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (date) => {
    if (!date) return "";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getMoonPhaseText = () => {
    if (!moonPhase || typeof moonPhase !== 'object') return "Loading...";
    return moonPhase.phaseName || moonPhase.phase || "Waxing Crescent";
  };

  // Safely extract values, ensuring we never render objects
  const totalCredits = credits && typeof credits === 'object' 
    ? (credits?.stats?.totalAvailable ?? credits?.credits ?? 0)
    : (typeof credits === 'number' ? credits : 0);
  const userName = user && typeof user === 'object'
    ? (user?.firstName || user?.email?.split("@")[0] || "there")
    : "there";
  const spiritualGrowthPercentage = Math.min(100, (xpCurrent / xpTarget) * 100);

  return (
    <>
      <style jsx>{`
        .header-stat-card :global(.card-content) {
          padding: 18px !important;
        }

        .header-stat-card {
          height: 88px;
          border-radius: var(--radius-md);
        }

        .progress-bar-glow {
          box-shadow: 0 0 12px rgba(168, 107, 255, 0.4), 0 0 24px rgba(255, 93, 180, 0.2);
        }

        .progress-bar {
          background: linear-gradient(90deg, var(--accent-3), var(--accent-1));
          width: 0%;
          transition: width 800ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .progress-bar.animate {
          width: var(--target-width);
        }

        .progress-bar-container {
          position: relative;
        }
      `}</style>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-6">
        {/* Left: Greeting Block */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl md:text-[28px] lg:text-[36px] font-bold text-gray-800 break-words">
              {getGreeting()}, {userName}
            </h1>
            <span className="text-xl sm:text-2xl md:text-[28px] lg:text-[36px] font-bold text-gray-800">{totalCredits}</span>
          </div>
          {mounted && currentDate && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
              <span className="break-words">{formatDate(currentDate)}</span>
              {moonPhase && typeof moonPhase === 'object' && Object.keys(moonPhase).length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg" aria-label={`Moon phase: ${getMoonPhaseText()}`}>{moonPhase.phaseEmoji || "🌙"}</span>
                  <span className="break-words">{moonPhase.phaseNumber || "319"} {getMoonPhaseText()}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Horizontal Stack of 4 Stat Cards */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 justify-end flex-wrap w-full md:w-auto">
          {/* Energy Level Card */}
          <Card size="sm" className="header-stat-card flex-shrink-0 w-full sm:w-[160px] md:w-[180px] lg:w-[200px] bg-white border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-yellow-500" aria-hidden="true" />
              <h4 className="text-gray-700 font-semibold text-xs">Energy</h4>
            </div>
            <div className="progress-bar-container relative">
              <div 
                className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1"
                role="progressbar"
                aria-valuenow={energy}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Energy level: ${energy}%`}
              >
                <div 
                  className={`progress-bar h-full progress-bar-glow rounded-full ${animateProgress ? 'animate' : ''}`}
                  style={{ 
                    // @ts-ignore
                    '--target-width': `${energy}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold text-xs">{energy}%</span>
                <span className="text-green-500 text-xs flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  ↑{energyChange}%
                </span>
              </div>
            </div>
          </Card>

          {/* Love Reading Card */}
          <Card size="sm" className="header-stat-card flex-shrink-0 w-full sm:w-[160px] md:w-[180px] lg:w-[200px] bg-white border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500" aria-hidden="true" />
                <h4 className="text-gray-700 font-semibold text-xs">Love</h4>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-pink-100 text-pink-600">
                Today
              </span>
            </div>
            <p className="text-xs truncate text-gray-500">Venus aligns</p>
            <Link 
              href="/dashboard#tarot-section"
              className="text-[10px] font-medium smooth-transition mt-1 inline-block text-purple-600 hover:text-purple-700"
            >
              View &gt;
            </Link>
          </Card>

          {/* Spiritual Growth Card */}
          <Card size="sm" className="header-stat-card flex-shrink-0 w-full sm:w-[160px] md:w-[180px] lg:w-[200px] bg-white border border-purple-100">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🕉️</span>
              <h4 className="text-gray-700 font-semibold text-xs">Growth</h4>
            </div>
            <div className="progress-bar-container relative mb-1">
              <div 
                className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(spiritualGrowthPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Spiritual growth: ${Math.round(spiritualGrowthPercentage)}% (Level ${level})`}
              >
                <div 
                  className={`progress-bar h-full progress-bar-glow rounded-full ${animateProgress ? 'animate' : ''}`}
                  style={{ 
                    // @ts-ignore
                    '--target-width': `${spiritualGrowthPercentage}%`
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">{xpCurrent.toLocaleString()}/{xpTarget.toLocaleString()}</span>
              <span className="text-gray-700 font-semibold text-xs">Lv.{level}</span>
            </div>
          </Card>

          {/* Daily Bonus Card */}
          <Card size="sm" className="header-stat-card flex-shrink-0 relative w-full sm:w-[160px] md:w-[180px] lg:w-[200px] bg-white border border-purple-100">
            <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-yellow-400 text-purple-900">
              NEW
            </span>
            <div className="flex items-center gap-1.5 mb-2">
              <Gift className="w-4 h-4 text-yellow-500" aria-hidden="true" />
              <h4 className="text-gray-700 font-semibold text-xs">Bonus</h4>
            </div>
            <p className="text-xs truncate mb-1 text-gray-500">Free reading</p>
            <Link 
              href="/dashboard#tarot-section"
              className="text-[10px] font-medium smooth-transition inline-block text-purple-600 hover:text-purple-700"
            >
              Claim &gt;
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}

