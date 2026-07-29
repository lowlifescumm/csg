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
            <h1 className="text-xl sm:text-2xl md:text-[28px] lg:text-[36px] font-bold text-cosmic-lavender break-words">
              {getGreeting()}, {userName}
            </h1>
            <span className="text-xl sm:text-2xl md:text-[28px] lg:text-[36px] font-bold text-cosmic-gold">{totalCredits}</span>
          </div>
          {mounted && currentDate && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-cosmic-taupe">
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
      </div>
    </>
  );
}

