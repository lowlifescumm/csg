"use client";
import { useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";

export default function CardCountSelector({ onSelect, onCancel }) {
  const [selectedCount, setSelectedCount] = useState(3);
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (selectedCount >= 1 && selectedCount <= 10) {
      // For 10-card spread, require a question
      if (selectedCount === 10 && !question.trim()) {
        alert("Please enter a question for your 10-card spread.");
        return;
      }
      onSelect({
        cardCount: selectedCount,
        question: question.trim(),
        spreadType: "custom_spread",
        spreadId: "custom_spread"
      });
    }
  };

  const cost = selectedCount; // 1 credit per card

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="glassmorphic rounded-3xl p-8 max-w-2xl w-full mx-4 border border-white border-opacity-40 apple-shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold gradient-text">1-10 Card Spread</h2>
              <p className="text-sm text-gray-400">Choose your spread size</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white smooth-transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Card Count Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Number of Cards: <span className="text-purple-400 font-semibold">{selectedCount}</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedCount(num)}
                  className={`py-3 px-4 rounded-xl font-semibold smooth-transition ${
                    selectedCount === num
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                      : "bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20 hover:scale-105"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Your Question {selectedCount === 10 ? "" : "(Optional)"}
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-4 rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 outline-none smooth-transition resize-none text-white placeholder-gray-400"
              rows={3}
              placeholder={selectedCount === 10 ? "What guidance do you seek? (Required for 10-card spread)" : "What guidance do you seek?"}
              required={selectedCount === 10}
            />
          </div>

          {/* Cost Display */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20 rounded-xl p-4 border border-purple-400 border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Cost</p>
                <p className="text-2xl font-bold text-white">{cost} Credit{cost !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">1 credit per card</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-6 rounded-xl bg-white bg-opacity-10 text-gray-300 font-semibold hover:bg-opacity-20 smooth-transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-xl hover:scale-105 smooth-transition flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

