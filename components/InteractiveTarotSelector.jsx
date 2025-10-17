"use client";
import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { ALL_CARDS } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";

export default function InteractiveTarotSelector({ onClose, onComplete, spreadType = "three-card", readingType = "general" }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [reading, setReading] = useState(null);
  const [question, setQuestion] = useState("");
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [error, setError] = useState("");
  const [flashMismatch, setFlashMismatch] = useState(false);
  
  const spread = (function resolveSpread() {
    // Map old spreadType strings to config ids
    const map = {
      "three-card": "past_present_future",
      "one-card": "one_card",
      "daily": "daily_tarot",
      "daily-love": "daily_love",
      "career": "daily_career",
      "yes-no": "yes_no",
      "love-potential": "love_potential",
      "breakup": "breakup",
      "ppf": "past_present_future",
      "flirt": "daily_flirt",
      "yin-yang": "yin_yang",
    };
    const id = map[spreadType] || spreadType;
    return spreads.find(s => s.id === id) || spreads.find(s => s.id === "past_present_future");
  })();

  const positions = spread.layout;

  useEffect(() => {
    // On mount and when spread changes, clear selections and prepare exactly N cards
    setSelectedCards([]);
    setShowQuestionInput(false);
    setError("");
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    setAvailableCards(shuffled.slice(0, spread.card_count));
  }, [spreadType]);

  const handleCardClick = (index) => {
    // If card is already selected, don't do anything
    if (selectedCards.includes(index)) return;
    
    // Add card to selected cards
    const newSelectedCards = [...selectedCards, index];
    setSelectedCards(newSelectedCards);
    
    // If all cards are selected, show question input
    const count = spread.card_count;
    if (newSelectedCards.length === count && !showQuestionInput && spread.ui?.require_question) {
      setShowQuestionInput(true);
    }
  };

  const handleGetReading = async () => {
    const required = spread.ui?.required_selection_count ?? spread.card_count;
    const selected = selectedCards.length;
    if (selected !== required) {
      setError(spread.ui?.selection_error_message || `Please select exactly ${required} card(s).`);
      setFlashMismatch(true);
      setTimeout(() => {
        setFlashMismatch(false);
        setSelectedCards([]);
      }, 1500);
      return;
    }
    if (spread.ui?.require_question && !question.trim()) {
      setError("Please enter your question before submitting.");
      return;
    }

    setLoading(true);
    
    try {
      // Prepare the selected cards data
      const selectedCardsData = selectedCards.map(index => ({
        ...availableCards[index],
        reversed: Math.random() > 0.5,
        position: positions[selectedCards.indexOf(index)]
      }));

      const res = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          spreadType,
          readingType,
          specificCards: selectedCardsData,
          cardCount: positions.length,
          spreadId: spread.id
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setReading(data.reading);
        setShowReading(true);
      } else {
        // Tarot is free, but handle other errors
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      alert("Failed to generate reading");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReading = () => {
    // Reset everything for a new reading
    setSelectedCards([]);
    setShowReading(false);
    setReading(null);
    setQuestion("");
    setShowQuestionInput(false);
    setError("");
    
    // Shuffle and pick new cards
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    setAvailableCards(shuffled.slice(0, spread.card_count));
  };

  if (showReading && reading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="glassmorphic rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto apple-shadow-lg border border-white border-opacity-40">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold gradient-text">Your Tarot Reading</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {reading.cards.map((card, i) => (
              <div key={i} className="text-center">
                <div className="bg-white rounded-2xl p-3 apple-shadow mb-3">
                  <div className="relative">
                    <img 
                      src={card.image} 
                      alt={card.name}
                      className={`w-full h-auto rounded-xl ${card.reversed ? 'rotate-180' : ''}`}
                    />
                    {card.reversed && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        Reversed
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">
                  {positions[i]}
                </p>
                <p className="font-medium text-gray-900">{card.name}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-3">Interpretation</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{reading.interpretation}</p>
          </div>

          <button
            onClick={handleNewReading}
            className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold smooth-transition hover:shadow-xl hover:scale-[1.02]"
          >
            New Reading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="glassmorphic rounded-3xl p-8 max-w-4xl w-full apple-shadow-lg border border-white border-opacity-40">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold gradient-text">Select Your Cards</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600 mb-2">
            {selectedCards.length === 0 && "Click on each card to reveal your destiny"}
            {selectedCards.length > 0 && selectedCards.length < positions.length && `${selectedCards.length} of ${positions.length} cards selected`}
            {selectedCards.length === positions.length && !showQuestionInput && "All cards selected!"}
          </p>
          {error && (
            <p className="text-red-600 text-sm mb-2">{error}</p>
          )}
          {showQuestionInput && (
            <div className="mt-4 max-w-md mx-auto">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What guidance do you seek?"
                className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-white bg-opacity-70"
                disabled={loading}
              />
            </div>
          )}
        </div>

        <div className={`grid grid-cols-${positions.length === 1 ? '1' : (positions.length === 2 ? '2' : '3')} gap-4 md:gap-8 mb-8`}>
          {Array.from({ length: spread.card_count }).map((_, index) => {
            const isSelected = selectedCards.includes(index);
            const selectionOrder = selectedCards.indexOf(index);
            
            return (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => handleCardClick(index)}
                  disabled={selectedCards.length === spread.card_count}
                  className={`
                    relative w-full max-w-[200px] aspect-[2/3] rounded-xl overflow-hidden
                    smooth-transition transform
                    ${!isSelected ? 'hover:scale-105 cursor-pointer hover:shadow-2xl' : 'scale-105'}
                    ${isSelected ? 'ring-4 ring-purple-400 ring-opacity-60' : ''}
                    ${flashMismatch ? 'ring-red-500 ring-4' : ''}
                    ${loading ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                  style={{
                    boxShadow: isSelected 
                      ? '0 0 30px rgba(147, 51, 234, 0.5)' 
                      : '0 10px 30px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {isSelected ? (
                    <div className="relative w-full h-full">
                      <img
                        src={availableCards[index].image}
                        alt={availableCards[index].name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-semibold drop-shadow-lg">
                            {availableCards[index].name}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {selectionOrder + 1}
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full group">
                      <img
                        src="/card-back.png"
                        alt="Card Back"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 smooth-transition flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 smooth-transition transform group-hover:scale-110" />
                      </div>
                    </div>
                  )}
                </button>
                <p className="mt-3 text-sm font-medium text-gray-700">
                  {positions[index]}
                </p>
                {isSelected && (
                  <p className="text-xs text-purple-500 mt-1">
                    Card {selectionOrder + 1}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {selectedCards.length === spread.card_count && (
          <button
            onClick={handleGetReading}
            disabled={loading || (spread.ui?.require_question ? !question.trim() : false)}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Consulting the cards...
              </span>
            ) : (
              "Get Your Reading"
            )}
          </button>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Tarot readings are for entertainment and guidance purposes
          </p>
        </div>
      </div>
    </div>
  );
}