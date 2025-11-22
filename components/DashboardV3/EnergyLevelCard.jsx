"use client";
import { Sun, TrendingUp } from "lucide-react";
import Card from "@/components/ui/Card";

export default function EnergyLevelCard({ energy = 75, change = 12 }) {
  return (
    <Card size="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">Energy Level</h3>
        </div>
      </div>
      <p className="text-purple-200 text-sm mb-4">Cosmic Energy</p>
      <div className="relative">
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 smooth-transition"
            style={{ width: `${energy}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-white font-semibold">{energy}%</span>
          <span className="text-green-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            ↑{change}%
          </span>
        </div>
      </div>
    </Card>
  );
}

