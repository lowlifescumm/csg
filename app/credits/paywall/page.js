"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Coins, Crown, Zap } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function PaywallPage() {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current credit balance
    apiClient
      .get("/api/credits/balance")
      .then((data) => {
        setCredits(data.balance || 0);
        setLoading(false);
      })
      .catch(() => {
        setCredits(0);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 bg-opacity-20 rounded-full mb-6">
            <Coins className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            You've Used Your Free Reading
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Get more credits to continue your spiritual journey
          </p>
        </div>

        {/* Credit Status */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm uppercase tracking-wide">
                Your Current Balance
              </p>
              <p className="text-4xl font-bold text-white mt-1">
                {loading ? "..." : credits} Credits
              </p>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-medium">
                1 free reading/day
              </p>
              <p className="text-purple-300 text-sm">
                Refreshes in 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* Quick Purchase Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Starter Pack */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Starter Pack</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">$4.99</p>
            <p className="text-purple-300 text-sm mb-4">5 credits</p>
            <ul className="text-purple-200 text-sm mb-6 space-y-2">
              <li>• 5 tarot readings</li>
              <li>• Credits never expire</li>
              <li>• One-time purchase</li>
            </ul>
            <Link
              href="/credits"
              className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
            >
              Get Credits
            </Link>
          </div>

          {/* Unlimited Subscription */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-yellow-400/50 hover:bg-opacity-15 transition-all relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Unlimited</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">$19.99</p>
            <p className="text-purple-300 text-sm mb-4">/month</p>
            <ul className="text-purple-200 text-sm mb-6 space-y-2">
              <li>• 60 credits/month</li>
              <li>• 90-day rollover</li>
              <li>• All reading types</li>
              <li>• 5% discount on reports</li>
            </ul>
            <Link
              href="/subscription"
              className="block w-full text-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
            >
              Subscribe
            </Link>
          </div>

          {/* Premium Subscription */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Premium</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">$39.99</p>
            <p className="text-purple-300 text-sm mb-4">/month</p>
            <ul className="text-purple-200 text-sm mb-6 space-y-2">
              <li>• 150 credits/month</li>
              <li>• 180-day rollover</li>
              <li>• Priority queue</li>
              <li>• 10% discount on reports</li>
            </ul>
            <Link
              href="/subscription"
              className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
            >
              Go Premium
            </Link>
          </div>
        </div>

        {/* Birth Chart Upsell */}
        <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Get Your Birth Chart Report
              </h3>
              <p className="text-purple-200">
                Unlock your complete astrological profile with personalized
                insights
              </p>
            </div>
            <Link
              href="/reports/essential"
              className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold py-3 px-6 rounded-xl hover:bg-opacity-90 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5" />
              Starting at $19
            </Link>
          </div>
        </div>

        {/* Back to Readings */}
        <div className="text-center">
          <Link
            href="/tarot"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Back to Tarot Readings
          </Link>
        </div>
      </div>
    </div>
  );
}
