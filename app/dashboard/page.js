"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";
import DashboardV3 from "@/components/DashboardV3";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
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
      <DashboardV3 user={user} />
    </DashboardLayoutShell>
  );
}