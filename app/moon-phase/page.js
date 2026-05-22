"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";

function getMoonPhase(date = new Date()) {
  // Simple moon phase calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let c, e, jd, b;
  if (month < 3) { year--; month += 12; }
  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09;
  jd /= 29.5305882;
  b = parseInt(jd);
  jd -= b;
  b = Math.round(jd * 8);
  
  if (b >= 8) b = 0;
  
  const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", 
                  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
  
  return {
    phase: phases[b],
    phaseIndex: b,
    illumination: Math.round((1 - Math.cos((jd * 2 * Math.PI))) * 50),
    age: Math.round(jd * 29.53)
  };
}

function getMoonPhaseIcon(phaseIndex) {
  const icons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return icons[phaseIndex] || "🌑";
}

function getNextFullMoon(date = new Date()) {
  const current = getMoonPhase(date);
  const daysToFull = current.phaseIndex <= 4 ? (4 - current.phaseIndex) * 3.69 : (12 - current.phaseIndex) * 3.69;
  const nextFull = new Date(date);
  nextFull.setDate(nextFull.getDate() + Math.round(daysToFull));
  return nextFull;
}

function getNextNewMoon(date = new Date()) {
  const current = getMoonPhase(date);
  const daysToNew = current.phaseIndex <= 0 ? 0 : (8 - current.phaseIndex) * 3.69;
  const nextNew = new Date(date);
  nextNew.setDate(nextNew.getDate() + Math.round(daysToNew));
  return nextNew;
}

export default function MoonPhaseTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moonData, setMoonData] = useState(null);
  const [weekView, setWeekView] = useState([]);

  useEffect(() => {
    const data = getMoonPhase(selectedDate);
    setMoonData(data);
    
    // Generate week view
    const week = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      week.push({
        date: d,
        data: getMoonPhase(d),
        isToday: i === 0
      });
    }
    setWeekView(week);
  }, [selectedDate]);

  const navigateDay = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (!moonData) return <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>;

  const nextFull = getNextFullMoon(selectedDate);
  const nextNew = getNextNewMoon(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-4xl">
              {getMoonPhaseIcon(moonData.phaseIndex)}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Moon Phase Tracker</h1>
              <p className="text-purple-200">Track lunar cycles and their cosmic influence</p>
            </div>
          </div>
        </div>

        {/* Current Phase Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-8xl">{getMoonPhaseIcon(moonData.phaseIndex)}</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">{moonData.phase}</h2>
              <p className="text-purple-200 text-lg mb-4">
                {moonData.illumination}% illuminated • Day {moonData.age} of 29.5
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                <div className="bg-white bg-opacity-10 rounded-xl p-4">
                  <p className="text-purple-300 text-sm">Next Full Moon</p>
                  <p className="text-white font-semibold">{nextFull.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-4">
                  <p className="text-purple-300 text-sm">Next New Moon</p>
                  <p className="text-white font-semibold">{nextNew.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 text-white transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <p className="text-white font-semibold text-lg">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-purple-300 text-sm">Click a day below to explore</p>
          </div>
          
          <button 
            onClick={() => navigateDay(1)}
            className="p-2 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 text-white transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {weekView.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(day.date)}
              className={`p-4 rounded-xl transition-all text-center ${
                day.isToday 
                  ? 'bg-purple-500 bg-opacity-40 border-2 border-purple-400' 
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-10'
              }`}
            >
              <p className="text-purple-300 text-xs mb-1">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className="text-2xl mb-1">{getMoonPhaseIcon(day.data.phaseIndex)}</p>
              <p className="text-white text-sm font-medium">{day.date.getDate()}</p>
              <p className="text-purple-300 text-xs mt-1">{day.data.phase}</p>
            </button>
          ))}
        </div>

        {/* Moon Phase Info */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-purple-300" />
            <h3 className="text-lg font-semibold text-white">About {moonData.phase}</h3>
          </div>
          <p className="text-purple-100 leading-relaxed">
            {getPhaseDescription(moonData.phase)}
          </p>
        </div>
      </div>
    </div>
  );
}

function getPhaseDescription(phase) {
  const descriptions = {
    "New Moon": "A time for new beginnings, setting intentions, and planting seeds for future growth. Perfect for starting fresh projects and making wishes.",
    "Waxing Crescent": "Build momentum on your intentions. Take action steps toward your goals. Energy is growing and expanding.",
    "First Quarter": "A time of challenge and decision-making. Overcome obstacles and commit to your path. Take decisive action.",
    "Waxing Gibbous": "Refine and adjust your plans. The energy is building toward culmination. Perfect for fine-tuning and preparation.",
    "Full Moon": "Peak energy and manifestation time. Celebrate achievements, release what no longer serves you, and embrace completion.",
    "Waning Gibbous": "Begin to release and let go. Share your wisdom with others. Gratitude practice is especially powerful now.",
    "Last Quarter": "Reflect and forgive. Release old patterns and habits. It's a time of conscious completion and inner cleansing.",
    "Waning Crescent": "Rest, restore, and surrender. Prepare for the new cycle. Meditation and spiritual practice are heightened."
  };
  return descriptions[phase] || "Each moon phase carries unique energy for your spiritual journey.";
}
