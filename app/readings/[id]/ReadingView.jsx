"use client";

import { Sparkles, ArrowLeft, Coins, Crown, FileText } from "lucide-react";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import spreads from "@/lib/tarot-spreads.json";
import ShareCard from "@/components/ShareCard";

export default function ReadingView({ reading }) {
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
            Reading from {new Date(reading.createdAt || reading.created_at).toLocaleDateString()}
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

        <ShareCard
          interpretation={interpretation}
          readingId={reading.id}
          cards={cards}
        />

        {/* Post-Reading Upsell Section */}
        <div className="bg-gradient-to-br from-indigo-800/50 to-purple-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Continue Your Spiritual Journey
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upsell 1: Purchase Credits */}
            <Link
              href="/credits"
              className="bg-white bg-opacity-10 hover:bg-opacity-15 rounded-xl p-6 border border-white border-opacity-20 transition-all text-center group"
            >
              <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Get More Credits
              </h3>
              <p className="text-purple-300 text-sm mb-3">
                5 credits for $4.99
              </p>
              <span className="inline-flex items-center gap-1 text-yellow-400 text-sm font-medium">
                Purchase →
              </span>
            </Link>

            {/* Upsell 2: Subscribe */}
            <Link
              href="/subscription"
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl p-6 border border-yellow-400/50 transition-all text-center group"
            >
              <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Go Unlimited
              </h3>
              <p className="text-purple-300 text-sm mb-3">
                $19.99/month
              </p>
              <span className="inline-flex items-center gap-1 text-yellow-400 text-sm font-medium">
                Subscribe →
              </span>
            </Link>

            {/* Upsell 3: Birth Chart Report */}
            <Link
              href="/reports/essential"
              className="bg-white bg-opacity-10 hover:bg-opacity-15 rounded-xl p-6 border border-white border-opacity-20 transition-all text-center group"
            >
              <FileText className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Birth Chart Report
              </h3>
              <p className="text-purple-300 text-sm mb-3">
                Starting at $19
              </p>
              <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium">
                Get Report →
              </span>
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
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
