"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import spreads from "@/lib/tarot-spreads.json";

export default function SharedReadingPage({ params }) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReading = async () => {
      try {
        const response = await fetch(`/api/readings/${params.id}`);
        const data = await response.json();

        if (data.success) {
          setReading(data.reading);
        } else {
          setError(data.error || "Failed to load reading");
        }
      } catch (err) {
        setError("Failed to load reading");
      } finally {
        setLoading(false);
      }
    };

    fetchReading();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Loading reading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 bg-opacity-20 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Reading Not Found</h1>
          <p className="text-purple-200 mb-8">{error}</p>
          <Link
            href="/tarot"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Get Your Own Reading
          </Link>
        </div>
      </div>
    );
  }

  const result = reading?.result || {};
  const cards = result.cards || [];
  const interpretation = result.interpretation || "";
  const spreadType = result.spreadType || "past_present_future";
  
  const spread = spreads.find((s) => s.id === spreadType) || spreads.find((s) => s.id === "past_present_future");
  const positions = spread?.layout || ["Card 1", "Card 2", "Card 3"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/tarot"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Get Your Own Reading
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Shared Tarot Reading</h1>
          {reading.question && (
            <p className="text-xl text-purple-200 mb-2">"{reading.question}"</p>
          )}
          <p className="text-purple-300 text-sm">
            Reading from {new Date(reading.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, i) => (
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
              <MarkdownRenderer text={interpretation} className="text-purple-100" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/tarot"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Get Your Own Reading
          </Link>
        </div>
      </div>
    </div>
  );
}