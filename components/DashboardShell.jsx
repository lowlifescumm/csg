"use client";
const logger = require('@/lib/logger');
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * DashboardShell - Top-level component that fetches and provides dashboard data
 * 
 * Fetches:
 * - User profile from /api/auth/user
 * - Credits from /api/credits
 * - Reading history from /api/readings
 * - Streak from /api/streak (optional, handles gracefully if missing)
 */
export default function DashboardShell({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [readings, setReadings] = useState(null);
  const [streak, setStreak] = useState(null);
  const [moonPhase, setMoonPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Utility function to recursively clean empty objects
  const cleanEmptyObjects = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanEmptyObjects);
    
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    
    const cleaned = {};
    for (const key of keys) {
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const cleanedValue = cleanEmptyObjects(value);
        if (cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        } else {
          cleaned[key] = null;
        }
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(cleanEmptyObjects);
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  };

  const safeJson = async (response, label) => {
    try {
      return await response.json();
    } catch (error) {
      logger.error(`[DashboardShell] Failed to parse ${label} response:`, error);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch user profile
      const userRes = await fetch("/api/auth/user", { credentials: 'include' });
      if (!userRes.ok) {
        throw new Error(`User fetch failed with status ${userRes.status}`);
      }
      const userData = await safeJson(userRes, 'user profile');
      if (!userData || !userData.user) {
        logger.warn("[DashboardShell] No authenticated user returned, redirecting to login");
        router.push("/login");
        return;
      }
      
      setUser(userData.user);

      // Fetch credits
      const creditsRes = await fetch("/api/credits", { credentials: 'include' });
      if (creditsRes.ok) {
        const creditsData = await safeJson(creditsRes, 'credits');
        const cleanedCredits = cleanEmptyObjects(creditsData);
        setCredits(cleanedCredits);
      }

      // Fetch readings
      const readingsRes = await fetch("/api/readings", { credentials: 'include' });
      if (readingsRes.ok) {
        const readingsData = await safeJson(readingsRes, 'readings');
        const cleanedReadings = cleanEmptyObjects(readingsData);
        setReadings(cleanedReadings);
      }

      // Fetch streak (optional - gracefully handles if endpoint doesn't exist)
      try {
        const streakRes = await fetch("/api/streak", { credentials: 'include' });
        if (streakRes.ok) {
          const streakData = await safeJson(streakRes, 'streak');
          const cleanedStreak = cleanEmptyObjects(streakData);
          setStreak(cleanedStreak);
        }
      } catch (streakError) {
        // Streak endpoint is optional, continue if it fails
        logger.info("Streak endpoint not available:", streakError);
      }

      // Fetch moon phase (optional - gracefully handles if endpoint doesn't exist)
      try {
        const moonRes = await fetch("/api/moon-phase", { credentials: 'include' });
        if (moonRes.ok) {
          const moonData = await safeJson(moonRes, 'moon phase');
          if (moonData.success && moonData.data) {
            const cleanedMoonPhase = cleanEmptyObjects(moonData.data);
            setMoonPhase(cleanedMoonPhase);
          }
        }
      } catch (moonError) {
        // Moon phase endpoint is optional, continue if it fails
        logger.info("Moon phase endpoint not available:", moonError);
      }

    } catch (err) {
      logger.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-200 animate-pulse mb-4">Loading your cosmic journey...</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pass all data to children via render prop pattern
  // Ensure we never pass empty objects - convert to null if needed
  const safeCredits = credits && typeof credits === 'object' && Object.keys(credits).length > 0 ? credits : null;
  const safeReadings = readings && typeof readings === 'object' && Object.keys(readings).length > 0 ? readings : null;
  const safeStreak = streak && typeof streak === 'object' && Object.keys(streak).length > 0 ? streak : null;
  const safeMoonPhase = moonPhase && typeof moonPhase === 'object' && Object.keys(moonPhase).length > 0 ? moonPhase : null;
  
  return children({
    user: user || null,
    credits: safeCredits,
    readings: safeReadings,
    streak: safeStreak,
    moonPhase: safeMoonPhase,
    refetch: fetchDashboardData,
  });
}

