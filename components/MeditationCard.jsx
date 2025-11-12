"use client";
import { useState, useEffect } from "react";
import { Brain, Lock, Clock, User, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * MeditationCard - Displays a meditation with play button and premium lock
 * 
 * Props:
 * - meditation: Meditation object with id, title, duration_seconds, narrator, premium, etc.
 * - isPremium: Whether user has premium access
 * - onStart: Callback when user clicks to start meditation
 */
export default function MeditationCard({ meditation, isPremium, onStart }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const isLocked = meditation.premium && !isPremium;

  const handleClick = () => {
    if (isLocked) {
      // Open premium upgrade modal or redirect
      window.location.href = "/subscription";
      return;
    }
    if (onStart) {
      onStart(meditation);
    }
  };

  return (
    <div
      className={`glassmorphic rounded-2xl p-6 border border-white border-opacity-40 hover:shadow-xl smooth-transition ${
        isLocked ? "opacity-75" : "cursor-pointer hover:bg-opacity-20"
      }`}
      onClick={!isLocked ? handleClick : undefined}
      role={!isLocked ? "button" : undefined}
      tabIndex={!isLocked ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${meditation.title} - ${formatDuration(meditation.duration_seconds)}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{meditation.title}</h3>
            {meditation.narrator && (
              <div className="flex items-center gap-1 text-purple-200 text-sm">
                <User className="w-3 h-3" />
                <span>{meditation.narrator}</span>
              </div>
            )}
          </div>
        </div>
        {isLocked && (
          <div className="flex-shrink-0">
            <Lock className="w-5 h-5 text-yellow-400" />
          </div>
        )}
      </div>

      {meditation.description && (
        <p className="text-purple-200 text-sm mb-4 line-clamp-2">{meditation.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-200 text-sm">
          <Clock className="w-4 h-4" />
          <span>{formatDuration(meditation.duration_seconds)}</span>
        </div>

        {meditation.tags && meditation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meditation.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-purple-500/30 text-purple-200 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {isLocked && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
          <p className="text-yellow-200 text-xs text-center">
            Premium meditation - <Link href="/subscription" className="underline font-semibold">Upgrade to unlock</Link>
          </p>
        </div>
      )}
    </div>
  );
}

