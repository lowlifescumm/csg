"use client";
import { useState, useEffect } from "react";
import { Trophy, Zap, Flame } from "lucide-react";
import StreakMilestones from "./StreakMilestones";
import StreakMilestoneCelebration from "./StreakMilestoneCelebration";
import { apiClient } from '@/lib/api-client';

/**
 * CompactDailyStreak - Compact widget combining level progress and streak info
 * Replaces the large GrowthBar + DailyTasks widgets to save space
 */
export default function CompactDailyStreak({ userId, streak }) {
  const [levelData, setLevelData] = useState({ level: 1, xpCurrent: 0, xpTarget: 100, totalXP: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Safely extract streak value, ensuring we never render objects
  const safeStreak = streak && typeof streak === 'object' && Object.keys(streak).length > 0 ? streak : null;

  useEffect(() => {
    if (!userId) return;
    
    async function fetchStats() {
      try {
        const data = await apiClient.get("/api/tasks");
        if (data?.success && data.stats) {
          const totalXP = data.stats.totalXP || 0;
          const level = Math.floor(totalXP / 100) + 1;
          const xpCurrent = totalXP % 100;
          setLevelData({
            level,
            xpCurrent,
            xpTarget: 100,
            totalXP
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }

    fetchStats();
  }, [userId]);

  const progressPercent = levelData.xpTarget > 0 ? Math.min((levelData.xpCurrent / levelData.xpTarget) * 100, 100) : 0;
  const currentStreak = safeStreak?.currentStreak || 0;
  const milestones = safeStreak?.milestones || [];
  const newMilestone = safeStreak?.newMilestone || null;

  // Show celebration when a new milestone is detected
  useEffect(() => {
    if (newMilestone) {
      setShowCelebration(true);
    }
  }, [newMilestone]);

  return (
    <div className="glassmorphic rounded-2xl p-4 sm:p-6 apple-shadow-lg border border-white border-opacity-40">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-violet-900">
              <span className="text-white font-bold text-xs">{levelData.level}</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Daily Streak</h3>
            <p className="text-purple-200 text-xs">Level {levelData.level} • {levelData.totalXP} XP</p>
          </div>
        </div>
        
        {currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl border border-orange-400/30">
            <Flame className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-white font-bold text-lg">{currentStreak}</div>
              <div className="text-orange-200 text-xs">days</div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-purple-200">Progress to Level {levelData.level + 1}</span>
          <span className="text-xs text-purple-200">{Math.floor(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-white bg-opacity-10 rounded-full overflow-hidden border border-white border-opacity-20">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 smooth-transition"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Streak Milestones */}
      <StreakMilestones currentStreak={currentStreak} milestones={milestones} />

      {/* Milestone Celebration */}
      <StreakMilestoneCelebration
        newMilestone={showCelebration ? newMilestone : null}
        onDismiss={() => setShowCelebration(false)}
      />

      <p className="text-xs text-purple-300 text-center mt-3">
        Complete daily tasks to level up and earn rewards
      </p>
    </div>
  );
}
