"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Sparkles, Moon, Heart, Brain, Trophy, Zap, X } from "lucide-react";
import Link from "next/link";
import { apiClient } from '@/lib/api-client';

// Task definitions
const TASK_DEFINITIONS = [
  {
    id: "three-card-spread",
    title: "Pull a 3-card spread",
    description: "Get insights from a classic tarot spread",
    icon: Sparkles,
    xpReward: 10,
    creditReward: 0,
    actionUrl: "/dashboard#tarot-section",
    actionType: "link",
  },
  {
    id: "sync-moon-phase",
    title: "Sync with moon phase",
    description: "Check today's moon phase guidance",
    icon: Moon,
    xpReward: 5,
    creditReward: 0,
    actionUrl: "/moon-reading",
    actionType: "link",
  },
  {
    id: "check-compatibility",
    title: "Check compatibility",
    description: "Explore relationship dynamics",
    icon: Heart,
    xpReward: 5,
    creditReward: 0,
    actionUrl: "/compatibility",
    actionType: "link",
  },
  // Meditation task temporarily hidden
  // {
  //   id: "meditation-session",
  //   title: "Start a meditation session",
  //   description: "Center yourself with guided practice",
  //   icon: Brain,
  //   xpReward: 5,
  //   creditReward: 1, // Occasionally
  //   actionUrl: "/coach",
  //   actionType: "link",
  // },
];

/**
 * Calculate streak bonus XP
 */
function calculateStreakBonus(currentStreak) {
  if (currentStreak === 0) return 0;
  if (currentStreak < 7) return 0;
  if (currentStreak < 14) return 5; // 7+ days
  if (currentStreak < 30) return 10; // 14+ days
  if (currentStreak < 60) return 15; // 30+ days
  return 20; // 60+ days
}

/**
 * DailyTasks - Gamified daily tasks with XP rewards and progress tracking
 * 
 * Props:
 * - userId: User ID for tracking completions
 * - streak: Current streak data
 */
export default function DailyTasks({ userId, streak }) {
  const [tasks, setTasks] = useState(TASK_DEFINITIONS);
  const [userStats, setUserStats] = useState({
    totalXP: 0,
    level: 1,
    xpToNextLevel: 100,
    completedTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch tasks and user stats
  useEffect(() => {
    fetchTasksAndStats();
  }, [userId]);

  const fetchTasksAndStats = async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const data = await apiClient.get(`/api/tasks?timezone=${encodeURIComponent(timezone)}`);
      if (data.success) {
        setUserStats(data.stats);
        const completedIds = data.completedTasks || [];
        setTasks((prevTasks) =>
          prevTasks.map((task) => ({
            ...task,
            completed: completedIds.includes(task.id),
          }))
        );
        if (onStatsUpdate) {
          onStatsUpdate(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    if (!userId || completingTask) return;

    setCompletingTask(taskId);

    try {
      const data = await apiClient.post("/api/tasks/complete", {
        taskId,
        userId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (data.success) {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          )
        );

        // Update stats
        const task = tasks.find((t) => t.id === taskId);
        const xpGained = task?.xpReward || 0;
        const creditGained = task?.creditReward || 0;
        const streakBonus = calculateStreakBonus(streak?.currentStreak || 0);
        const totalXPGained = xpGained + streakBonus;

        const newStats = {
          ...userStats,
          totalXP: (userStats.totalXP || 0) + totalXPGained,
          completedTasks: [...(userStats.completedTasks || []), taskId],
        };
        setUserStats(newStats);
        
        // Notify parent of stats update
        if (onStatsUpdate) {
          onStatsUpdate(newStats);
        }

        // Show toast notification
        showToast({
          type: "success",
          message: `Task completed! +${totalXPGained} XP`,
          details: streakBonus > 0 ? `Including ${streakBonus} XP streak bonus!` : null,
          creditGained: creditGained > 0 ? creditGained : null,
        });

        // Refresh stats from server
        setTimeout(() => {
          fetchTasksAndStats();
        }, 500);
      } else {
        showToast({
          type: "error",
          message: data.error || "Failed to complete task",
        });
      }
    } catch (err) {
      console.error("Error completing task:", err);
      showToast({
        type: "error",
        message: "Failed to complete task. Please try again.",
      });
    } finally {
      setCompletingTask(null);
    }
  };

  const showToast = (toastData) => {
    setToast(toastData);
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Calculate level from XP (100 XP per level)
  const calculateLevel = (xp) => {
    return Math.floor(xp / 100) + 1;
  };

  const calculateXPToNextLevel = (xp) => {
    const currentLevelXP = (calculateLevel(xp) - 1) * 100;
    return 100 - (xp - currentLevelXP);
  };

  const currentLevel = calculateLevel(userStats.totalXP || 0);
  const xpToNextLevel = calculateXPToNextLevel(userStats.totalXP || 0);
  const xpProgress = ((userStats.totalXP || 0) % 100) / 100;
  
  // Expose level data for parent component
  const levelData = {
    level: currentLevel,
    xpCurrent: userStats.totalXP || 0,
    xpTarget: currentLevel * 100,
  };

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Daily Sacred Tasks</h2>
            <p className="text-purple-200 text-sm sm:text-base">Complete tasks to earn XP and grow spiritually</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-white font-semibold">Level {currentLevel}</div>
              <div className="text-purple-200 text-xs">{userStats.totalXP || 0} XP</div>
            </div>
          </div>
        </div>

        {/* Spiritual Growth Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-200">Spiritual Growth</span>
            <span className="text-sm text-purple-200">{xpToNextLevel} XP to Level {currentLevel + 1}</span>
          </div>
          <div className="h-3 bg-white bg-opacity-10 rounded-full overflow-hidden border border-white border-opacity-20">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 smooth-transition"
              style={{ width: `${xpProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {tasks.map((task) => {
            const Icon = task.icon;
            const isCompleted = task.completed;
            const isCompleting = completingTask === task.id;

            return (
              <div
                key={task.id}
                className={`bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20 smooth-transition ${
                  isCompleted ? "opacity-60" : "hover:bg-opacity-20"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => !isCompleted && handleTaskComplete(task.id)}
                    disabled={isCompleted || isCompleting}
                    className={`flex-shrink-0 mt-1 smooth-transition ${
                      isCompleted
                        ? "text-green-400"
                        : "text-purple-200 hover:text-purple-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-5 h-5 text-purple-300" />
                          <h3
                            className={`font-semibold ${
                              isCompleted ? "text-purple-300 line-through" : "text-white"
                            }`}
                          >
                            {task.title}
                          </h3>
                        </div>
                        <p className="text-purple-200 text-sm">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/30 rounded-lg">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-medium">+{task.xpReward} XP</span>
                        </div>
                        {task.creditReward > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/30 rounded-lg">
                            <Sparkles className="w-4 h-4 text-green-400" />
                            <span className="text-white font-medium">+{task.creditReward}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Link */}
                    {!isCompleted && task.actionUrl && (
                      <Link
                        href={task.actionUrl}
                        className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 text-sm font-medium smooth-transition mt-2"
                      >
                        <span>Start task</span>
                        <span>→</span>
                      </Link>
                    )}

                    {isCompleting && (
                      <div className="flex items-center gap-2 text-purple-200 text-sm mt-2">
                        <div className="w-4 h-4 border-2 border-purple-200 border-t-transparent rounded-full animate-spin"></div>
                        <span>Completing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak Bonus Info */}
        {streak && streak.currentStreak > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-white border-opacity-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  {streak.currentStreak} Day Streak Active!
                </div>
                <div className="text-purple-200 text-sm">
                  Earn bonus XP for completing tasks. Current bonus: +{calculateStreakBonus(streak.currentStreak)} XP per task
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`glassmorphic rounded-2xl p-4 apple-shadow-lg border border-white border-opacity-40 min-w-[300px] ${
              toast.type === "success"
                ? "bg-green-500/20 border-green-400/50"
                : "bg-red-500/20 border-red-400/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 ${
                  toast.type === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <X className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold mb-1 ${
                    toast.type === "success" ? "text-green-200" : "text-red-200"
                  }`}
                >
                  {toast.message}
                </p>
                {toast.details && (
                  <p
                    className={`text-sm ${
                      toast.type === "success" ? "text-green-200/80" : "text-red-200/80"
                    }`}
                  >
                    {toast.details}
                  </p>
                )}
                {toast.creditGained && (
                  <p className="text-sm text-green-200/80 mt-1">
                    +{toast.creditGained} credit earned!
                  </p>
                )}
              </div>
              <button
                onClick={() => setToast(null)}
                className={`flex-shrink-0 ${
                  toast.type === "success" ? "text-green-200 hover:text-green-100" : "text-red-200 hover:text-red-100"
                } smooth-transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

