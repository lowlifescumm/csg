"use client";
import { useState } from "react";

const TYPES = [
  { key: "daily", title: "Daily Tarot", desc: "One card. Your question. The pattern you can't see yet.", spreadType: "daily" },
  { key: "daily-love", title: "Daily Love Tarot", desc: "What the cards reveal about your heart — not what you want to hear.", spreadType: "daily-love" },
  { key: "career", title: "Daily Career Tarot", desc: "The choice, risk, or opening your work life is asking you to see.", spreadType: "career" },
  { key: "yes-no", title: "Yes/No Tarot", desc: "A direct answer with the reason behind it.", spreadType: "yes-no" },
  { key: "love-potential", title: "Love Potential Tarot", desc: "What is possible between you — and what needs honesty first.", spreadType: "love-potential" },
  { key: "breakup", title: "Breakup Tarot", desc: "The lesson, the wound, and the next step back to yourself.", spreadType: "breakup" },
  { key: "one-card", title: "One Card Tarot", desc: "One card for the question you can't stop circling.", spreadType: "one-card" },
  { key: "ppf", title: "Past Present Future", desc: "Past, present, and future — the pattern, the moment, the next move.", spreadType: "ppf" },
  { key: "flirt", title: "Daily Flirt Tarot", desc: "A playful read on attraction, timing, and the signal beneath the spark.", spreadType: "flirt" },
  { key: "yin-yang", title: "Yin Yang Tarot", desc: "See the tension, the mirror, and the path back to center.", spreadType: "yin-yang" },
  { key: "custom_spread", title: "1-10 Card Spread", desc: "Choose how many cards your question needs. One credit per card.", spreadType: "custom_spread", isCustom: true },
];

export default function TarotReadingTypePicker({ onPick }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {TYPES.map((t) => (
        <button
          key={t.key}
          onClick={() => {
            setSelected(t.key);
            onPick?.(t);
          }}
          className={`text-left glassmorphic rounded-2xl p-5 border border-white border-opacity-40 hover:shadow-2xl smooth-transition hover:bg-opacity-20 ${selected===t.key? 'ring-2 ring-purple-400 bg-opacity-20' : ''}`}
        >
          <div className="text-xl font-semibold gradient-text mb-1">{t.title}</div>
          <div className="text-purple-200 text-sm">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}


