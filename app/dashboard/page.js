"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";
import DashboardV3 from "@/components/DashboardV3";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// GSTA-399: Redirect loop prevention
const REDIRECT_GUARD_KEY = "dashboard_redirect_guard";
const REDIRECT_THRESHOLD = 2;
const REDIRECT_WINDOW_MS = 30_000;

function checkRedirectGuard() {
  try {
    const raw = sessionStorage.getItem(REDIRECT_GUARD_KEY);
    if (!raw) return { count: 0, firstTs: 0 };
    const { count, firstTs } = JSON.parse(raw);
    if (Date.now() - firstTs > REDIRECT_WINDOW_MS) {
      sessionStorage.removeItem(REDIRECT_GUARD_KEY);
      return { count: 0, firstTs: 0 };
    }
    return { count, firstTs };
  } catch {
    return { count: 0, firstTs: 0 };
  }
}

function incrementRedirectGuard() {
  try {
    const state = checkRedirectGuard();
    const newState = {
      count: state.count + 1,
      firstTs: state.firstTs || Date.now(),
    };
    sessionStorage.setItem(REDIRECT_GUARD_KEY, JSON.stringify(newState));
    return newState;
  } catch {
    // sessionStorage unavailable
  }
}

function clearRedirectGuard() {
  try {
    sessionStorage.removeItem(REDIRECT_GUARD_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loopError, setLoopError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch user - this works for both NextAuth and JWT auth
        const data = await apiClient.get("/api/auth/user", { cache: 'no-store' });
        
        if (data.user) {
          setUser(data.user);
          clearRedirectGuard();
          setLoading(false);
        } else if (data.error) {
          // API returned error (e.g., 500)
          setError(data.error);
          setLoading(false);
        } else {
          // No user - not authenticated
          const guard = incrementRedirectGuard();
          if (guard && guard.count >= REDIRECT_THRESHOLD) {
            console.error("[Dashboard] Redirect loop detected");
            setLoopError(true);
            setLoading(false);
            return;
          }
          window.location.href = "/login?redirect=dashboard";
        }
      } catch (err) {
        console.error("[Dashboard] Auth check failed:", err);
        const guard = incrementRedirectGuard();
        if (guard && guard.count >= REDIRECT_THRESHOLD) {
          console.error("[Dashboard] Redirect loop detected after error");
          setLoopError(true);
          setLoading(false);
          return;
        }
        window.location.href = "/login?redirect=dashboard";
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (loopError) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-white text-center max-w-md p-8">
          <h2 className="text-xl font-bold mb-4 text-cosmic-gold">Session Issue Detected</h2>
          <p className="mb-6">Your session could not be loaded. This may be due to:</p>
          <ul className="text-left text-white/70 mb-6 list-disc pl-6">
            <li>Expired authentication</li>
            <li>Cookie conflicts between auth methods</li>
            <li>Browser storage issues</li>
          </ul>
          <button 
            onClick={() => {
              clearRedirectGuard();
              // Clear both auth cookies
              document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              window.location.href = "/login?redirect=dashboard";
            }}
            className="px-6 py-3 bg-cosmic-gold text-cosmic-void rounded-lg font-medium hover:bg-cosmic-gold/90"
          >
            Clear Session & Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">{error || "Please log in to view your dashboard"}</p>
          <button 
            onClick={() => window.location.href = "/login?redirect=dashboard"}
            className="px-4 py-2 bg-cosmic-gold text-cosmic-void rounded-lg font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayoutShell>
      <div className="text-white p-8">
        <h1>DASHBOARD V3 LOADED</h1>
        <p>User: {user?.email || 'No user'}</p>
      </div>
      <DashboardV3 user={user} />
    </DashboardLayoutShell>
  );
}