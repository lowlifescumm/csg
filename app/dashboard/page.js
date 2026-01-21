"use client";
import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="sr-only">Dashboard Loading...</h1>
          <p className="text-gray-200 animate-pulse mb-4">Loading your cosmic journey...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            </div>
            <h1 className="sr-only">Dashboard Loading...</h1>
            <p className="text-gray-200 animate-pulse mb-4">Loading your cosmic journey...</p>
          </div>
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}
