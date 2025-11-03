"use client";
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

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch user profile
      const userRes = await fetch("/api/auth/user");
      const userData = await userRes.json();
      
      if (!userData.user) {
        router.push("/login");
        return;
      }
      
      setUser(userData.user);

      // Fetch credits
      const creditsRes = await fetch("/api/credits");
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCredits(creditsData);
      }

      // Fetch readings
      const readingsRes = await fetch("/api/readings");
      if (readingsRes.ok) {
        const readingsData = await readingsRes.json();
        setReadings(readingsData);
      }

      // Fetch streak (optional - gracefully handles if endpoint doesn't exist)
      try {
        const streakRes = await fetch("/api/streak");
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData);
        }
      } catch (streakError) {
        // Streak endpoint is optional, continue if it fails
        console.log("Streak endpoint not available:", streakError);
      }

      // Fetch moon phase (optional - gracefully handles if endpoint doesn't exist)
      try {
        const moonRes = await fetch("/api/moon-phase");
        if (moonRes.ok) {
          const moonData = await moonRes.json();
          if (moonData.success && moonData.data) {
            setMoonPhase(moonData.data);
          }
        }
      } catch (moonError) {
        // Moon phase endpoint is optional, continue if it fails
        console.log("Moon phase endpoint not available:", moonError);
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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
  return children({
    user,
    credits,
    readings,
    streak,
    moonPhase,
    refetch: fetchDashboardData,
  });
}

