"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";
import DashboardV3 from "@/components/DashboardV3";

export const dynamic = "force-dynamic";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cosmic-gold/30 border-t-cosmic-gold rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, creditsRes, readingsRes, streakRes, moonRes] = await Promise.all([
          apiClient.get("/api/auth/user").catch(() => null),
          apiClient.get("/api/credits").catch(() => null),
          apiClient.get("/api/readings").catch(() => null),
          apiClient.get("/api/streak").catch(() => null),
          apiClient.get("/api/moon-phase").catch(() => null),
        ]);

        if (!userRes?.user) {
          // Not authenticated - redirect
          window.location.href = "/login?redirect=dashboard";
          return;
        }

        setData({
          user: userRes.user,
          credits: creditsRes,
          readings: readingsRes,
          streak: streakRes,
          moonPhase: moonRes?.data || null,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center p-6">
        <div className="glassmorphic rounded-3xl p-8 border border-white/10 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Something went wrong</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <LoadingSpinner />;

  const { user, credits, readings, streak, moonPhase } = data;

  return (
    <DashboardLayoutShell
      user={user}
      credits={credits}
      streak={streak}
      moonPhase={moonPhase}
      energy={75}
      energyChange={12}
      level={5}
      xpCurrent={2450}
      xpTarget={3000}
      mainContent={
        <DashboardV3
          user={user}
          credits={credits}
          readings={readings}
          streak={streak}
          moonPhase={moonPhase}
          refetch={() => window.location.reload()}
        />
      }
    />
  );
}
