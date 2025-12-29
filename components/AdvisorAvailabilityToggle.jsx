"use client";
import { useState, useEffect, useRef } from "react";

/**
 * AdvisorAvailabilityToggle - Toggle component for advisors to go online/offline
 * 
 * Props:
 * - advisorProfile: Advisor profile object with is_advisor, is_online, etc.
 * - onStatusChange: Optional callback when status changes
 * 
 * Features:
 * - Toggle switch for online/offline status
 * - Heartbeat mechanism (sends heartbeat every 30 seconds when online)
 * - Automatic cleanup on unmount
 * - Error handling
 */
export default function AdvisorAvailabilityToggle({ advisorProfile, onStatusChange }) {
  const [isOnline, setIsOnline] = useState(advisorProfile?.is_online || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const heartbeatIntervalRef = useRef(null);

  // Update local state when profile changes
  useEffect(() => {
    if (advisorProfile) {
      setIsOnline(advisorProfile.is_online || false);
    }
  }, [advisorProfile]);

  // Heartbeat function - sends ping to backend
  const sendHeartbeat = async () => {
    try {
      const response = await fetch("/api/marketplace/advisors/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Heartbeat failed:", response.status);
        // Don't show error to user for heartbeat failures, just log
      }
    } catch (err) {
      console.error("Heartbeat error:", err);
      // Don't show error to user for heartbeat failures
    }
  };

  // Start heartbeat interval when going online
  const startHeartbeat = () => {
    // Clear any existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Send immediate heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 seconds
  };

  // Stop heartbeat interval when going offline
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Handle toggle change
  const handleToggle = async (newStatus) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/marketplace/advisors/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsOnline(newStatus);
        
        // Start/stop heartbeat based on new status
        if (newStatus) {
          startHeartbeat();
        } else {
          stopHeartbeat();
        }

        // Call optional callback
        if (onStatusChange) {
          onStatusChange(newStatus, data.data);
        }
      } else {
        setError(data.error || "Failed to update availability status");
        // Reset toggle to previous state on error
        setIsOnline(!newStatus);
      }
    } catch (err) {
      setError("Failed to connect to server");
      // Reset toggle to previous state on error
      setIsOnline(!newStatus);
    } finally {
      setLoading(false);
    }
  };

  // Start/stop heartbeat when online status changes
  useEffect(() => {
    if (isOnline && advisorProfile?.is_advisor) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    // Cleanup on unmount
    return () => {
      stopHeartbeat();
    };
  }, [isOnline, advisorProfile?.is_advisor]); // Restart heartbeat when status changes

  // Check if user is an approved advisor
  const isApprovedAdvisor = advisorProfile?.is_advisor === true;

  if (!isApprovedAdvisor) {
    return null; // Don't render if not an approved advisor
  }

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white bg-opacity-70">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">Availability Status</div>
          <div className="text-sm text-gray-600">
            {isOnline ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online - Accepting sessions
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Offline
              </span>
            )}
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={loading}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 ${
            isOnline 
              ? 'bg-green-500 peer-focus:ring-green-300' 
              : 'bg-gray-300 peer-focus:ring-gray-300'
          } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}></div>
        </label>
      </div>
    </div>
  );
}

