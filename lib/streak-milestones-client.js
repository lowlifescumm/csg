export const MILESTONE_DEFINITIONS = [
  { days: 7, badgeName: "Cosmic Spark", credits: 3, icon: "spark" },
  { days: 14, badgeName: "Stargazer", credits: 5, icon: "star" },
  { days: 30, badgeName: "Lunar Devotee", credits: 10, icon: "moon" },
  { days: 60, badgeName: "Solar Champion", credits: 15, icon: "sun" },
  { days: 100, badgeName: "Celestial Master", credits: 25, icon: "crown" },
  { days: 365, badgeName: "Cosmic Legend", credits: 100, icon: "legend" },
];

export function getMilestoneByDays(days) {
  return MILESTONE_DEFINITIONS.find(m => m.days === days) || null;
}

export function getApplicableMilestones(currentStreak) {
  return MILESTONE_DEFINITIONS.filter(m => currentStreak >= m.days);
}

export function getNextMilestone(currentStreak) {
  return MILESTONE_DEFINITIONS.find(m => currentStreak < m.days) || null;
}

export function getMilestoneIcon(icon) {
  const icons = {
    spark: "✨",
    star: "⭐",
    moon: "🌙",
    sun: "☀️",
    crown: "👑",
    legend: "🌟",
  };
  return icons[icon] || "🏆";
}
