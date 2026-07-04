"use client";
import { useState, useEffect } from "react";
import { Gift, Zap, X, Sparkles, Trophy } from "lucide-react";
import { getMilestoneIcon, getMilestoneByDays } from "@/lib/streak-milestones-client";

export default function StreakMilestoneCelebration({ newMilestone, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newMilestone) {
      setVisible(true);
    }
  }, [newMilestone]);

  if (!visible || !newMilestone) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const milestoneDef = getMilestoneByDays(newMilestone.days);
  const iconName = milestoneDef?.icon || "crown";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-xl border border-yellow-400/50 max-w-md w-full text-center animate-scale-in">
        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            className="p-1 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-purple-200" />
          </button>
        </div>

        <div className="text-5xl mb-4 animate-bounce">
          {getMilestoneIcon(iconName)}
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h2 className="text-2xl font-bold gradient-text">Milestone Reached!</h2>
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>

        <div className="mb-4">
          <div className="text-4xl font-bold text-white mb-1">{newMilestone.days} Day Streak</div>
          <div className="inline-block px-4 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-400/30">
            <span className="text-yellow-300 font-semibold">{newMilestone.badgeName}</span>
          </div>
        </div>

        {newMilestone.credits > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Reward Earned!</p>
                <p className="text-yellow-200 text-sm">
                  <Zap className="w-4 h-4 inline mr-1" />
                  +{newMilestone.credits} credits added to your account
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleDismiss}
          className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          <span>Continue Your Journey</span>
        </button>
      </div>
    </div>
  );
}
