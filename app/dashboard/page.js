"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";
import DashboardV3 from "@/components/DashboardV3";
import LoadingSkeleton from "@/components/LoadingSkeleton";
const logger = { error: (...a) => console.error(...a) };

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiClient.get("/api/auth/user", { cache: 'no-store' });

        if (data.user) {
          setUser(data.user);
          setLoading(false);
        } else if (data.error) {
          setError(data.error);
          setLoading(false);
        } else {
          window.location.href = "/login?redirect=dashboard";
        }
      } catch (err) {
        window.location.href = "/login?redirect=dashboard";
      }
    };

    checkAuth();
  }, []);

  // Fetch the authoritative credit balance (credit_ledger) so the dashboard
  // reflects reality. Without this the credit pill always shows 0.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadCredits = async () => {
      try {
        const data = await apiClient.get("/api/credits", { cache: 'no-store' });
        if (active && data) setCredits(data);
      } catch (err) {
        // Non-fatal: UI falls back to 0; avoid breaking the dashboard.
        logger?.error?.('[Dashboard] Failed to load credits:', err);
      }
    };
    loadCredits();
    return () => { active = false; };
  }, [user]);

  const refreshCredits = async () => {
    try {
      const data = await apiClient.get("/api/credits", { cache: 'no-store' });
      if (data) setCredits(data);
    } catch (err) {
      logger?.error?.('[Dashboard] Failed to refresh credits:', err);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
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
      <DashboardV3 user={user} credits={credits} refetch={refreshCredits} />
    </DashboardLayoutShell>
  );
}