"use client";
import { useState } from "react";

const TYPES = [
  { key: "daily", title: "Daily Tarot", desc: "Start your day with guidance.", spreadType: "daily" },
  { key: "daily-love", title: "Daily Love Tarot", desc: "Romantic insights for the day.", spreadType: "daily-love" },
  { key: "career", title: "Daily Career Tarot", desc: "Work and opportunity guidance.", spreadType: "career" },
  { key: "yes-no", title: "Yes/No Tarot", desc: "Clear yes/no with advice.", spreadType: "yes-no" },
  { key: "love-potential", title: "Love Potential Tarot", desc: "Is there potential here?", spreadType: "love-potential" },
  { key: "breakup", title: "Breakup Tarot", desc: "Why it ended and how to move on.", spreadType: "breakup" },
  { key: "one-card", title: "One Card Tarot", desc: "A single focused pull.", spreadType: "one-card" },
  { key: "ppf", title: "Past Present Future", desc: "Three-card classic timeline.", spreadType: "ppf" },
  { key: "flirt", title: "Daily Flirt Tarot", desc: "Fun, light-hearted vibes.", spreadType: "flirt" },
  { key: "yin-yang", title: "Yin Yang Tarot", desc: "Balance opposing energies.", spreadType: "yin-yang" },
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
          className={`text-left glassmorphic rounded-2xl p-5 border border-white border-opacity-40 hover:shadow-2xl smooth-transition ${selected===t.key? 'ring-2 ring-purple-400' : ''}`}
        >
          <div className="text-xl font-semibold gradient-text mb-1">{t.title}</div>
          <div className="text-gray-600">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}


