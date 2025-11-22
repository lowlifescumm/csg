"use client";
import { Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";

export default function SpiritualGrowthCard({ level = 5, xpCurrent = 2450, xpTarget = 3000 }) {
  const percentage = Math.min(100, (xpCurrent / xpTarget) * 100);
  
  return (
    <Card size="md">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">🕉️</div>
        <h3 className="text-white font-semibold">Spiritual Growth</h3>
      </div>
      <div className="relative mb-2">
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 smooth-transition"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-purple-200 text-sm">{xpCurrent.toLocaleString()} / {xpTarget.toLocaleString()} XP</span>
        <span className="text-white font-semibold">Level {level}</span>
      </div>
    </Card>
  );
}

