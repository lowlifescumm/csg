"use client";
import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import DashboardShell from "@/components/DashboardShell";

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
          <p className="text-gray-200 animate-pulse mb-4">Loading your cosmic journey...</p>
        </div>
      </div>
    ),
  }
);

const LegacyDashboardClient = nextDynamic(
  () => import("@/app__disabled/_dashboard_disabled/page"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-200 animate-pulse mb-4">Loading classic dashboard…</p>
        </div>
      </div>
    ),
  }
);

/**
 * DashboardPage - Main dashboard route
 *
 * Uses DashboardShell to fetch real data and DashboardV3Client for rendering.
 * Falls back to the legacy dashboard unless the DASHBOARD_V3 flag (or invite token)
 * enables the new experience.
 */
function DashboardPageInner() {
  const searchParams = useSearchParams();

  const canUseV3 = useMemo(() => {
    const flagEnabled = (process.env.NEXT_PUBLIC_DASHBOARD_V3 || "").toLowerCase() === "true";
    const inviteToken = process.env.NEXT_PUBLIC_DASHBOARD_V3_INVITE || "";
    const inviteParam = searchParams?.get("v3_invite") || "";
    const hasInvite = inviteToken.length > 0 && inviteParam === inviteToken;

    if (flagEnabled || hasInvite) {
      return true;
    }

    return false;
  }, [searchParams]);

  if (!canUseV3) {
    return <LegacyDashboardClient />;
  }

  return (
    <DashboardShell>
      {({ user, credits, readings, streak, moonPhase, refetch }) => (
        <DashboardV3Client
          user={user}
          credits={credits}
          readings={readings}
          streak={streak}
          moonPhase={moonPhase}
          refetch={refetch}
        />
      )}
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
            <p className="text-gray-200 animate-pulse mb-4">Loading your cosmic journey...</p>
          </div>
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}
