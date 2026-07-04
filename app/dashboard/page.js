"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";
import DashboardV3 from "@/components/DashboardV3";
import LoadingScreen from "@/components/LoadingScreen";

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    
    if (!session) {
      window.location.href = "/login?redirect=dashboard";
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await apiClient.get("/api/auth/user");
        if (data.user) {
          setUser(data.user);
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [session, sessionStatus]);

  if (sessionStatus === "loading" || loading) {
    return <LoadingScreen />;
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