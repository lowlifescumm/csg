"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Bell, X, Clock } from "lucide-react";
import Link from "next/link";

/**
 * AdvisorSessionNotification - Visual alert widget for pending session requests
 * 
 * Props:
 * - advisorProfile (object, optional) - Advisor profile data to check is_advisor status
 */
export default function AdvisorSessionNotification({ advisorProfile = null }) {
  const router = useRouter();
  const [pendingSessions, setPendingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdvisor, setIsAdvisor] = useState(false);

  // Check if user is an advisor
  useEffect(() => {
    if (advisorProfile?.is_advisor) {
      setIsAdvisor(true);
    } else if (advisorProfile === null) {
      // If no profile passed, check via API
      fetchAdvisorStatus();
    } else {
      setIsAdvisor(false);
    }
  }, [advisorProfile]);

  // Fetch advisor status if not provided
  const fetchAdvisorStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/marketplace/advisors/profile");
      const data = await response.json();
      
      if (data.success && data.data?.is_advisor) {
        setIsAdvisor(true);
      } else {
        setIsAdvisor(false);
      }
    } catch (err) {
      console.error("Error fetching advisor status:", err);
      setIsAdvisor(false);
    }
  }, []);

  // Fetch pending sessions
  const fetchPendingSessions = async () => {
    try {
      const response = await fetch("/api/marketplace/advisors/sessions/pending");
      const data = await response.json();

      if (data.success && data.data?.sessions) {
        setPendingSessions(data.data.sessions);
        setError("");
      } else {
        setPendingSessions([]);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching pending sessions:", err);
      setError("Failed to load session requests");
      setPendingSessions([]);
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Polling for pending sessions
  useEffect(() => {
    if (!isAdvisor) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchPendingSessions();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchPendingSessions();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAdvisor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render if user is not an advisor
  if (!isAdvisor || loading) {
    return null;
  }

  // Don't render if no pending sessions
  if (pendingSessions.length === 0) {
    return null;
  }

  // Get most recent session
  const mostRecentSession = pendingSessions[0];
  const sessionCount = pendingSessions.length;

  // Format time since request
  const getTimeSinceRequest = (createdAt) => {
    if (!createdAt) return "Just now";
    const now = new Date();
    const requestTime = new Date(createdAt);
    const diffMs = now - requestTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 30) return "Just now";
    if (diffMins < 1) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = () => {
    // Navigate to the most recent session
    router.push(`/advisor/session/${mostRecentSession.id}`);
  };

  return (
    <div className="mb-6 animate-fade-in">
      <div
        onClick={handleNotificationClick}
        className="glassmorphic rounded-2xl p-5 border-2 border-purple-400 border-opacity-60 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 smooth-transition cursor-pointer apple-shadow-lg relative overflow-hidden"
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          {/* Icon with badge */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            {sessionCount > 1 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                <span className="text-xs font-bold text-white">{sessionCount}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">
                New Chat Request{sessionCount > 1 ? `s (${sessionCount})` : ''}
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              {mostRecentSession.user.avatar_url ? (
                <img
                  src={mostRecentSession.user.avatar_url}
                  alt={mostRecentSession.user.name}
                  className="w-8 h-8 rounded-full border-2 border-white/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                  <span className="text-xs font-semibold text-white">
                    {mostRecentSession.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {mostRecentSession.user.name}
                </p>
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeSinceRequest(mostRecentSession.created_at)}</span>
                  {mostRecentSession.per_minute_rate && (
                    <>
                      <span>•</span>
                      <span>${parseFloat(mostRecentSession.per_minute_rate).toFixed(2)}/min</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Arrow */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center smooth-transition group-hover:bg-white/30">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Pulse animation indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
      </div>
    </div>
  );
}

