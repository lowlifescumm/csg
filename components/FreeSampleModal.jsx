"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, Lock } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function FreeSampleModal({ isOpen, onClose }) {
  const [step, setStep] = useState("intention"); // intention | loading | result | signup
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState(null);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("intention");
      setQuestion("");
      setReading(null);
      setError("");
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleStartReading = async () => {
    if (!question.trim()) {
      setError("Please share your intention or question");
      return;
    }
    
    setStep("loading");
    setIsAnimating(true);
    
    try {
      const res = await fetch("/api/tarot/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await res.json();
      
      if (data.success) {
        // Simulate card reveal animation delay
        setTimeout(() => {
          setReading(data.reading);
          setStep("result");
          setIsAnimating(false);
        }, 1500);
      } else {
        setError(data.error || "Something went wrong");
        setStep("intention");
        setIsAnimating(false);
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
      setStep("intention");
      setIsAnimating(false);
    }
  };

  const handleGetFullReading = () => {
    window.location.href = "/dashboard";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto apple-shadow-2xl border border-white/40 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-10 h-10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold gradient-text">
                {step === "intention" && "Your Free Tarot Preview"}
                {step === "loading" && "The Cards Are Being Drawn..."}
                {step === "result" && "Your Reading"}
              </h2>
              {step === "result" && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Sample reading • Full reading available free
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 smooth-transition"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Step: Intention Input */}
        {step === "intention" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                100% Free • No signup required
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Ask the cards what you need to know
              </h3>
              <p className="text-gray-600 max-w-lg mx-auto">
                Get a personalized 3-card tarot reading instantly. 
                Past, Present, and Future revealed.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What guidance are you seeking?
              </label>
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setError("");
                }}
                className="w-full p-4 rounded-2xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition resize-none text-gray-900 placeholder-gray-400 bg-white/70 apple-shadow min-h-[120px]"
                placeholder="e.g., What should I focus on in my career? or What do I need to know about my relationship?"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {error}
                </p>
              )}
            </div>

            {/* Quick suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {[
                "What does my future hold?",
                "How can I find clarity?", 
                "What am I not seeing?",
                "What's blocking me?"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="px-4 py-2 bg-white/60 hover:bg-white border border-purple-100 rounded-full text-sm text-gray-700 smooth-transition hover:border-purple-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="max-w-xl mx-auto">
              <button
                onClick={handleStartReading}
                disabled={isAnimating}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Reveal My Cards
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Takes 2 seconds • No email required
              </p>
            </div>
          </div>
        )}

        {/* Step: Loading / Card Animation */}
        {step === "loading" && (
          <div className="py-12 text-center">
            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="relative w-24 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `translateY(${i === 1 ? '-10px' : '0'})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                  </div>
                  <div className="absolute inset-0 border-2 border-white/30 rounded-xl" />
                  {/* Card back pattern */}
                  <div className="absolute inset-4 border border-white/20 rounded-lg opacity-50" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Sparkles className="w-8 h-8 text-white/60" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-lg text-gray-700 font-medium mb-2">
              Shuffling the deck...
            </p>
            <p className="text-gray-500">
              The cards are aligning with your energy
            </p>
          </div>
        )}

        {/* Step: Result Display */}
        {step === "result" && reading && (
          <div className="space-y-8">
            {/* Cards Display */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {reading.cards.map((card, i) => (
                <div
                  key={i}
                  className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="relative bg-white rounded-2xl p-2 sm:p-3 apple-shadow-lg mb-3 group hover:scale-105 smooth-transition">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={card.image}
                        alt={card.name}
                        className={`w-full h-auto ${card.reversed ? 'rotate-180' : ''}`}
                      />
                      {card.reversed && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                          Reversed
                        </div>
                      )}
                    </div>
                    {/* Hover overlay with meaning */}
                    <div className="absolute inset-2 bg-purple-900/90 rounded-xl opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center p-2">
                      <p className="text-white text-xs text-center leading-tight">
                        {card.reversed ? card.reversed : card.upright}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">
                    {reading.positions[i]}
                  </p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                    {card.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Interpretation */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-2">Your Guidance</h3>
                  <div className="text-gray-700 leading-relaxed">
                    <MarkdownRenderer text={reading.interpretation} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sample notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-800 font-medium text-sm">
                  This is a preview reading
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Get the full interpretation with detailed card meanings, 
                  personalized insights, and save your reading history.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGetFullReading}
                className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Get Your Free Full Reading
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setStep("intention");
                  setQuestion("");
                  setReading(null);
                }}
                className="sm:w-auto px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold smooth-transition hover:bg-gray-50 hover:border-gray-300"
              >
                Ask Another Question
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              Join 50,000+ people who've discovered their path
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
