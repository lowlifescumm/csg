"use client";
import { MILESTONE_DEFINITIONS, getMilestoneIcon, getNextMilestone } from "@/lib/streak-milestones-client";
import { Lock, Gift, Zap } from "lucide-react";

export default function StreakMilestones({ currentStreak, milestones }) {
  const nextMilestone = getNextMilestone(currentStreak);
  const achievedMilestones = milestones?.filter(m => m.achieved) || [];
  const achievedDays = new Set(achievedMilestones.map(m => m.days));

  if (achievedMilestones.length === 0 && !nextMilestone) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4 text-yellow-400" />
        <h4 className="text-sm font-semibold text-white">Streak Milestones</h4>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {MILESTONE_DEFINITIONS.map((def) => {
          const achieved = achievedDays.has(def.days);
          const isNext = nextMilestone?.days === def.days && !achieved;

          return (
            <div
              key={def.days}
              className={`
                relative rounded-xl p-2 text-center smooth-transition border
                ${achieved
                  ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30"
                  : isNext
                    ? "bg-white bg-opacity-5 border-purple-400/30 border-dashed"
                    : "bg-white bg-opacity-5 border-white border-opacity-10 opacity-50"
                }
              `}
            >
              <div className="text-lg mb-1">
                {achieved ? getMilestoneIcon(def.icon) : "🔒"}
              </div>
              <div className={`text-xs font-semibold ${achieved ? "text-yellow-300" : "text-purple-300"}`}>
                {def.days}d
              </div>
              {achieved && (
                <div className="text-[10px] text-yellow-200/70 mt-0.5 leading-tight">
                  {def.badgeName}
                </div>
              )}
              {!achieved && (
                <div className="text-[10px] text-purple-400 mt-0.5 leading-tight">
                  {def.days} days
                </div>
              )}
              {achieved && def.credits > 0 && (
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] text-yellow-300">+{def.credits}</span>
                </div>
              )}
              {isNext && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
