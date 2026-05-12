"use client";
const logger = require('../../lib/logger');
import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, Sparkles, ArrowLeft, Crown, Zap } from "lucide-react";

export default function CoachPage() {
  const [newCard, setNewCard] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState("");
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setIsPremium(data.role === 'admin' || (data.stripe_subscription_id && data.stripe_subscription_id !== ''));
      }
    } catch (e) {
      logger.error("Failed to fetch user data");
    }
  };

  const runCoach = async () => {
    if (!isPremium) {
      alert("Premium subscription required for AI Coach access");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/coach/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCard, question })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoach(data.coach);
      } else {
        alert(data.error || "Coach failed");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Spiritual Coach</h1>
                  <p className="text-sm text-gray-600">Premium AI-powered guidance</p>
                </div>
              </div>
            </div>
            {!isPremium && (
              <Link
                href="/subscription"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Premium Access Banner */}
        {!isPremium ? (
          <div className="glassmorphic rounded-2xl p-8 mb-8 border border-yellow-400/30 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 apple-shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
              <p className="text-gray-600 mb-6">AI Spiritual Coach is available exclusively for premium subscribers</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/subscription"
                  className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 smooth-transition apple-shadow"
                >
                  Upgrade to Premium
                </Link>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-white/60 text-gray-700 font-semibold rounded-xl hover:bg-white/80 smooth-transition border border-gray-200"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Coach Interface */}
            <div className="glassmorphic rounded-2xl p-8 mb-8 apple-shadow-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Get AI Guidance</h2>
                  <p className="text-gray-600">Ask your spiritual coach anything</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Card (Optional)</label>
                  <input 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-white/70" 
                    placeholder="What card did you draw today?" 
                    value={newCard} 
                    onChange={e=>setNewCard(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
                  <input 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-white/70" 
                    placeholder="What guidance do you seek?" 
                    value={question} 
                    onChange={e=>setQuestion(e.target.value)} 
                  />
                </div>
                <button 
                  disabled={loading} 
                  onClick={runCoach} 
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 smooth-transition apple-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Getting Guidance...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Get AI Guidance</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Coach Response */}
            {coach && (
              <div className="glassmorphic rounded-2xl p-8 apple-shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Your AI Coach Says:</h3>
                </div>
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">{coach}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


