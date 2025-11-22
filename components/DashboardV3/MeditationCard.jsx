"use client";
import { Brain } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function MeditationCard({ streak = 7 }) {
  return (
    <Card size="sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Meditation</h3>
        <Brain className="w-4 h-4" style={{ color: 'var(--accent-3)' }} aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white font-semibold text-sm">{streak} Day Streak</span>
        <span className="text-xs">⭐</span>
      </div>
      <Link
        href="/coach"
        className="gradient-button block w-full px-3 py-2 text-xs font-semibold rounded-full smooth-transition text-center relative"
        style={{ color: '#ffffff' }}
      >
        <span className="relative z-10">Start Today's Session</span>
      </Link>
      <div className="flex gap-1.5 mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full ${
              i < streak
                ? "smooth-transition"
                : "bg-white/10"
            }`}
            style={i < streak ? {
              background: 'linear-gradient(90deg, var(--accent-1), var(--accent-2))'
            } : {}}
          />
        ))}
      </div>
    </Card>
  );
}

