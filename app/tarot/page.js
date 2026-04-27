"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import TarotReadingTypePicker from "@/components/TarotReadingTypePicker";
import InteractiveTarotSelector from "@/components/InteractiveTarotSelector";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import spreads from "@/lib/tarot-spreads.json";

export default function TarotPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [reading, setReading] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [isPremium, setIsPremium] = useState(null);

  useEffect(() => {
    checkCreditsStatus();
  }, []);

  const checkCreditsStatus = async () => {
    setLoadingCredits(true);
    try {
      const response = await fetch("/api/credits");
      const data = await response.json();
      setIsPremium(data.isPremium || false);
    } catch (error) {
      console.error("Error checking credits:", error);
      setIsPremium(false);
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleTypePick = (type) => {
    setSelectedType(type);
    setShowCardSelector(true);
    setReading(null);
  };

  const handleCardSelectorClose = () => {
    setShowCardSelector(false);
    setSelectedType(null);
  };

  const handleReadingComplete = (readingData) => {
    setReading(readingData);
    setShowCardSelector(false);
    checkCreditsStatus();
  };

  const handleNewReading = () => {
    setReading(null);
    setSelectedType(null);
    setShowCardSelector(false);
  };

  if (loadingCredits) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (reading) {
    const spread = spreads.find((s) => s.id === selectedType?.spreadType) || spreads.find((s) => s.id === "past_present_future");
    const positions = spread?.layout || ["Card 1", "Card 2", "Card 3"];

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles className="w-10 h-10 text-yellow-300" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Your Tarot Reading</h1>
            <p className="text-xl text-purple-200">{selectedType?.title || "Tarot Reading"}</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {reading.cards?.map((card, i) => (
                <div key={i} className="text-center">
                  <div className="bg-white rounded-2xl p-3 shadow-xl mb-3">
                    <div className="relative">
                      <img
                        src={card.image}
                        alt={card.name}
                        className={`w-full h-auto rounded-xl ${card.reversed ? "rotate-180" : ""}`}
                      />
                      {card.reversed && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          Reversed
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                    {positions[i] || `Card ${i + 1}`}
                  </p>
                  <p className="font-medium text-white">{card.name}</p>
                </div>
              ))}
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                Interpretation
              </h3>
              <div className="text-purple-100 leading-relaxed">
                <MarkdownRenderer text={reading.interpretation} className="text-purple-100" />
              </div>
            </div>
          </div>

          <button
            onClick={handleNewReading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            New Reading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Tarot Readings</h1>
          <p className="text-xl text-purple-200">Choose your spread and let the cards reveal their wisdom</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Select a Reading Type</h2>
          <TarotReadingTypePicker onPick={handleTypePick} />
        </div>

        <div className="mt-8 text-center text-purple-200 text-sm">
          {isPremium ? (
            <p>Premium member - unlimited readings</p>
          ) : (
            <p>Basic tarot readings are free</p>
          )}
        </div>
      </div>

      {showCardSelector && selectedType && (
        <InteractiveTarotSelector
          onClose={handleCardSelectorClose}
          onComplete={handleReadingComplete}
          spreadType={selectedType.spreadType}
          spreadId={selectedType.spreadType}
          readingType="general"
        />
      )}
    </div>
  );
}
