"use client";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";

/**
 * FocusModal - Modal to capture user intent before generating tarot reading
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback when modal should close
 * - onSubmit: Callback with user's question/intent (string)
 * - readingType: Type of reading (e.g., "love", "career", "general")
 */
export default function FocusModal({ isOpen, onClose, onSubmit, readingType = "general" }) {
  const [intent, setIntent] = useState("");

  const handleSubmit = (skip = false) => {
    onSubmit(skip ? "" : intent.trim());
    setIntent(""); // Clear after submit
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="glassmorphic rounded-3xl p-8 max-w-2xl w-full apple-shadow-xl border border-white border-opacity-40 bg-gradient-to-br from-violet-900/90 via-purple-900/90 to-indigo-900/90">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Connect with the Guide</h2>
              <p className="text-purple-200 text-sm mt-1">The cards speak clearest when you focus your intent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition text-white"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <label htmlFor="intent-input" className="block text-sm font-medium text-purple-200 mb-3">
              What is weighing on your heart right now?
              <span className="text-purple-400 ml-2">(Optional)</span>
            </label>
            <textarea
              id="intent-input"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your question, concern, or situation. The more specific you are, the clearer the guidance will be..."
              className="w-full h-32 p-4 rounded-xl border border-white border-opacity-30 bg-white bg-opacity-10 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 outline-none smooth-transition resize-none"
              autoFocus
            />
            <p className="text-xs text-purple-300 mt-2">
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl/Cmd + Enter</kbd> to submit
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSubmit(false)}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Reveal Answers
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="sm:w-auto px-6 py-4 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-xl font-medium smooth-transition border border-white border-opacity-30"
            >
              Skip
            </button>
          </div>

          <p className="text-xs text-center text-purple-300">
            Your intention helps the guide provide more personalized and meaningful insights
          </p>
        </div>
      </div>
    </div>
  );
}
