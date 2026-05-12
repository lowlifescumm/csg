const logger = require('./lib/logger');
"use client";
import { useState, useEffect } from "react";
import { Sparkles, BookOpen, Loader2, Flame, Droplets, Wind, Mountain } from "lucide-react";
import { zodiacSigns } from "@/lib/zodiac-data";

// Element icons mapping
const elementIcons = {
  Fire: Flame,
  Water: Droplets,
  Air: Wind,
  Earth: Mountain,
};

// Element tips mapping
const elementTips = {
  Fire: "Channel your passion into action today. Bold moves bring rewards.",
  Water: "Trust your intuition. Emotions are your guide to deeper truths.",
  Air: "Communicate clearly. Ideas flow when you express them openly.",
  Earth: "Stay grounded and practical. Methodical steps lead to success.",
};

/**
 * Generate dummy energy rhythm data for 24 hours
 */
function generateEnergyRhythm() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.map((hour) => ({
    hour,
    energy: Math.floor(Math.random() * 40) + 30, // 30-70% energy
    label: hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`,
  }));
}

/**
 * CosmicBriefing - Zodiac briefing with sign selector, today's message, and guided reading
 * 
 * Props:
 * - userId: User ID for fetching birth chart and generating readings
 * - onReadingComplete: Callback when reading is completed
 */
export default function CosmicBriefing({ userId, onReadingComplete }) {
  const [selectedSign, setSelectedSign] = useState(null);
  const [userSign, setUserSign] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReading, setLoadingReading] = useState(false);
  const [savingJournal, setSavingJournal] = useState(false);
  const [error, setError] = useState(null);
  const [energyRhythm] = useState(generateEnergyRhythm());

  // Fetch user's birth chart to get their sun sign
  useEffect(() => {
    const fetchUserSign = async () => {
      try {
        const res = await fetch("/api/birth-chart");
        if (res.ok) {
          const data = await res.json();
          if (data.chart?.planets?.sun?.sign) {
            const sunSign = data.chart.planets.sun.sign;
            setUserSign(sunSign);
            setSelectedSign(sunSign);
          }
        }
      } catch (err) {
        logger.info("Could not fetch user sign, defaulting to Aries");
        setSelectedSign("Aries");
      }
    };

    fetchUserSign();
  }, []);

  // Fetch briefing when sign changes
  useEffect(() => {
    if (selectedSign) {
      fetchBriefing(selectedSign);
    }
  }, [selectedSign]);

  const fetchBriefing = async (sign) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/briefing?sign=${sign.toLowerCase()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBriefing(data.briefing);
      } else {
        setError(data.error || "Failed to load briefing");
      }
    } catch (err) {
      logger.error("Failed to fetch briefing:", err);
      setError("Failed to load briefing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReading = async () => {
    if (!selectedSign) return;

    setLoadingReading(true);
    setError(null);

    try {
      const res = await fetch("/api/readings/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "guided",
          sign: selectedSign,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError({
            type: "insufficient_credits",
            message: data.error || "Insufficient credits",
            details: data.details,
            cost: data.cost,
          });
        } else {
          setError({
            type: "error",
            message: data.error || "Failed to generate reading",
            details: data.details,
          });
        }
        setLoadingReading(false);
        return;
      }

      // Call completion callback
      if (onReadingComplete) {
        onReadingComplete(data.reading || data);
      }

      setLoadingReading(false);
    } catch (err) {
      logger.error("Error generating reading:", err);
      setError({
        type: "error",
        message: "Failed to connect to server. Please try again.",
      });
      setLoadingReading(false);
    }
  };

  const handleSaveToJournal = async () => {
    if (!briefing) return;

    setSavingJournal(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sign: selectedSign,
          content: briefing.message || briefing.content,
          type: "briefing",
          date: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Show success feedback
        setError(null);
        // Could use a toast notification library here
        // For now, we'll just clear any previous errors
      } else {
        setError({
          type: "error",
          message: data.error || "Failed to save to journal",
        });
      }
    } catch (err) {
      logger.error("Error saving to journal:", err);
      setError({
        type: "error",
        message: "Failed to save to journal. Please try again.",
      });
    } finally {
      setSavingJournal(false);
    }
  };

  const getSignEmoji = (sign) => {
    const emojis = {
      Aries: "♈",
      Taurus: "♉",
      Gemini: "♊",
      Cancer: "♋",
      Leo: "♌",
      Virgo: "♍",
      Libra: "♎",
      Scorpio: "♏",
      Sagittarius: "♐",
      Capricorn: "♑",
      Aquarius: "♒",
      Pisces: "♓",
    };
    return emojis[sign] || "⭐";
  };

  const currentSign = zodiacSigns.find((s) => s.name === selectedSign);
  const ElementIcon = currentSign ? elementIcons[currentSign.element] : Flame;
  const elementTip = currentSign ? elementTips[currentSign.element] : "";

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Briefing Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text">Cosmic Briefing</h2>
            {userSign && selectedSign === userSign && (
              <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-semibold rounded-full">
                Your Sign
              </span>
            )}
          </div>

          {/* Sign Selector Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {zodiacSigns.map((sign) => {
              const isSelected = selectedSign === sign.name;
              const isUserSign = userSign === sign.name;

              return (
                <button
                  key={sign.name}
                  onClick={() => setSelectedSign(sign.name)}
                  className={`px-4 py-2 rounded-xl smooth-transition text-sm font-medium ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white apple-shadow-lg scale-105"
                      : "bg-white bg-opacity-10 text-purple-200 hover:bg-opacity-20 apple-shadow"
                  } ${isUserSign && !isSelected ? "ring-2 ring-purple-400/50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getSignEmoji(sign.name)}</span>
                    <span>{sign.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Today's Message */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : error && typeof error === "string" ? (
            <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          ) : briefing ? (
            <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{getSignEmoji(selectedSign)}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedSign} - {briefing.title || "Today's Message"}
                  </h3>
                  <p className="text-purple-200 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <div className="text-white text-opacity-90 leading-relaxed whitespace-pre-line">
                {briefing.message || briefing.content || briefing.text}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleGenerateReading}
              disabled={loadingReading || !selectedSign}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingReading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Guided Reading</span>
                </>
              )}
            </button>

            {briefing && (
              <button
                onClick={handleSaveToJournal}
                disabled={savingJournal}
                className="px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white border-opacity-20"
              >
                {savingJournal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Save to Journal</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && typeof error === "object" && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6">
              <p className="text-red-200 font-medium mb-1">{error.message}</p>
              {error.details && <p className="text-red-200/80 text-sm">{error.details}</p>}
              {error.type === "insufficient_credits" && (
                <a
                  href="/credits"
                  className="inline-block mt-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 smooth-transition"
                >
                  Purchase Credits
                </a>
              )}
            </div>
          )}

          {/* Energy Rhythm Chart */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Energy Rhythm (24hr)</h4>
            <div className="bg-white bg-opacity-5 rounded-xl p-4 border border-white border-opacity-10">
              <div className="flex items-end justify-between gap-1 h-32">
                {energyRhythm.map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm transition-all hover:opacity-80 smooth-transition"
                      style={{ height: `${point.energy}%` }}
                      title={`${point.label}: ${point.energy}%`}
                    />
                    {idx % 4 === 0 && (
                      <span className="text-xs text-purple-200 mt-2">{point.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Element Focus Card */}
        {currentSign && (
          <div className="lg:w-64 flex-shrink-0">
            <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40 sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ElementIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Element Focus</h4>
                  <p className="text-purple-200 text-sm">{currentSign.element}</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20">
                <p className="text-white text-sm leading-relaxed">{elementTip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

