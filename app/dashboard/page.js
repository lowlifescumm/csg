"use client";
import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import DashboardShell from "@/components/DashboardShell";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";

// Force client-side rendering to avoid hydration mismatches
export const dynamic = "force-dynamic";

// Disable SSR completely for dashboard to avoid hydration mismatches
const DashboardV3Client = nextDynamic(
  () => import("@/components/DashboardV3/index"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-cosmic-gold/30 border-t-cosmic-gold rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    ),
  }
);

/**
 * DashboardPage - Main dashboard route
 *
 * Uses DashboardShell to fetch real data and DashboardV3Client for rendering.
 * Dashboard V3 is now the default and only dashboard version.
 */
function DashboardPageInner() {

  return (
    <DashboardShell>
      {({ user, credits, readings, streak, moonPhase, refetch }) => {
        // If no user is authenticated, show login prompt
        if (!user) {
          return (
            <div className="min-h-screen bg-cosmic-void flex items-center justify-center p-6">
              <div className="glassmorphic rounded-3xl p-10 border border-white/10 w-full max-w-md text-center">
                <div className="inline-block mb-6">
                  <img src="/logos/csg-logo-primary.svg" alt="Cosmic Spirit Guide" className="w-20 h-20 mx-auto object-contain" />
                </div>
                <h1 className="text-3xl font-semibold gradient-text mb-4">Welcome Back</h1>
                <p className="text-white/60 mb-8">
                  Sign in to access your dashboard, track your transits, save readings, and build your cosmic profile.
                </p>
                <a
                  href="/login?redirect=dashboard&message=save-readings"
                  className="inline-block w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Sign In
                </a>
              </div>
            </div>
          );
        }

        // Calculate energy and level data for header
        const totalCredits = credits?.stats?.totalAvailable || credits?.credits || 0;
        const energy = 75; // Default, can be calculated from user activity
        const energyChange = 12; // Default
        const level = 5; // Default, can be calculated from XP
        const xpCurrent = 2450; // Default, should come from user stats
        const xpTarget = 3000; // Default

        return (
          <DashboardLayoutShell
            user={user}
            credits={credits}
            streak={streak}
            moonPhase={moonPhase}
            energy={energy}
            energyChange={energyChange}
            level={level}
            xpCurrent={xpCurrent}
            xpTarget={xpTarget}
            mainContent={
              <DashboardV3Client
                user={user}
                credits={credits}
                readings={readings}
                streak={streak}
                moonPhase={moonPhase}
                refetch={refetch}
              />
            }
          />
        );
      }}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-cosmic-gold/30 border-t-cosmic-gold rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}
