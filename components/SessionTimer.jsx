"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

/**
 * SessionTimer - Displays elapsed time since session start
 * 
 * Props:
 * - startTime: Date object or ISO string representing session start time
 * - rate: Optional per-minute rate to calculate estimated cost
 */
export default function SessionTimer({ startTime, rate = null }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime);
    const now = new Date();
    const initialElapsed = Math.floor((now - start) / 1000);
    setElapsedSeconds(initialElapsed);

    // Update every second
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate estimated cost
  const estimatedCost = rate && elapsedSeconds > 0
    ? ((elapsedSeconds / 60) * rate).toFixed(2)
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-white border-opacity-30">
      <Clock className="w-5 h-5 text-purple-300" />
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs text-purple-200 uppercase tracking-wide">Session Time</div>
          <div className="text-lg font-bold text-white tabular-nums">
            {formatTime(elapsedSeconds)}
          </div>
        </div>
        {estimatedCost && (
          <div className="pl-4 border-l border-white border-opacity-20">
            <div className="text-xs text-purple-200 uppercase tracking-wide">Est. Cost</div>
            <div className="text-lg font-bold text-white">
              ${estimatedCost}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

