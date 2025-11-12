"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star, Moon, Heart, Zap } from "lucide-react";
import WebsiteTour from "@/components/WebsiteTour";
import TourGuide from "@/components/TourGuide";

export default function TourDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [demoState, setDemoState] = useState("idle");
  const [demoMessage, setDemoMessage] = useState("Hello! I'm your cosmic tour guide! 🌟");

  const demoStates = [
    { state: "idle", message: "Hello! I'm your cosmic tour guide! 🌟" },
    { state: "pointing", message: "Let me show you around the website! 👆" },
    { state: "celebrating", message: "Great job! You're doing amazing! 🎉" },
  ];

  const cycleDemo = () => {
    const currentIndex = demoStates.findIndex((d) => d.state === demoState);
    const nextIndex = (currentIndex + 1) % demoStates.length;
    const nextState = demoStates[nextIndex];

    setDemoState(nextState.state);
    setDemoMessage(nextState.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      <div className="p-8 sm:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white smooth-transition mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold gradient-text mb-2">
                  Website Tour Demo
                </h1>
                <p className="text-purple-200">Experience our interactive tour guide</p>
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="glassmorphic rounded-3xl p-8 mb-6 apple-shadow-lg border border-white border-opacity-40">
            <h2 className="text-2xl font-semibold text-white mb-6">Demo Controls</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition apple-shadow flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {showDemo ? "Hide" : "Show"} Tour Guide
              </button>

              <button
                onClick={cycleDemo}
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 smooth-transition apple-shadow flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Cycle Animation States
              </button>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6 border border-white border-opacity-20">
              <h3 className="text-white font-semibold mb-2">Current State:</h3>
              <p className="text-purple-200 capitalize mb-2">{demoState}</p>
              <p className="text-purple-200 text-sm">{demoMessage}</p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Design Elements
              </h3>
              <ul className="text-purple-200 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Cosmic-themed character</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Purple & pink color scheme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Friendly facial expressions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Animated sparkles</span>
                </li>
              </ul>
            </div>

            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Animation States
              </h3>
              <ul className="text-purple-200 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>Idle:</strong> Welcoming pose</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>Pointing:</strong> Directing attention</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span><strong>Celebrating:</strong> Success feedback</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Full Tour Demo */}
          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">Full Website Tour</h2>
            <p className="text-purple-200 text-center mb-6">
              Click the button below to start the interactive tour of the dashboard
            </p>
            <div className="flex justify-center">
              <WebsiteTour />
            </div>
          </div>

          {/* Tour Guide Display */}
          {showDemo && (
            <div className="mt-8 relative min-h-[400px]">
              <TourGuide state={demoState} message={demoMessage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
