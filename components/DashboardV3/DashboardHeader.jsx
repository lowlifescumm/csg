"use client";
import { useState, useEffect } from "react";
import { Bell, Moon } from "lucide-react";

export default function DashboardHeader({ user, moonPhase, streak, credits }) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(null);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentDate(now);
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

  // Safely extract values, ensuring we never render objects
  const safeCredits = credits && typeof credits === 'object' && Object.keys(credits).length > 0 ? credits : null;
  const safeStreak = streak && typeof streak === 'object' && Object.keys(streak).length > 0 ? streak : null;
  const safeMoonPhase = moonPhase && typeof moonPhase === 'object' && Object.keys(moonPhase).length > 0 ? moonPhase : null;

  const getMoonPhaseText = () => {
    if (!safeMoonPhase) return "Loading...";
    return safeMoonPhase.phaseName || safeMoonPhase.phase || "Waxing Crescent";
  };

  const currentStreak = safeStreak?.currentStreak || 0;
  const totalCredits = safeCredits?.stats?.totalAvailable || safeCredits?.credits || 0;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {user?.firstName || user?.email?.split("@")[0] || "there"}
          </h1>
          <span className="text-3xl font-bold text-white">{totalCredits}</span>
        </div>
        {mounted && currentDate && (
          <div className="flex items-center gap-4 text-purple-200 text-sm">
            <span>{formatDate(currentDate)}</span>
            {safeMoonPhase && (
              <span className="flex items-center gap-1">
                <Moon className="w-4 h-4" />
                {safeMoonPhase.phaseNumber || "319"} {getMoonPhaseText()}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-white hover:text-purple-200 smooth-transition">
          <Bell className="w-6 h-6" />
        </button>
        {currentStreak > 0 && (
          <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center gap-2">
            <span className="text-white">⭐</span>
            <span className="text-white font-semibold">{currentStreak} day streak</span>
          </div>
        )}
      </div>
    </div>
  );
}

