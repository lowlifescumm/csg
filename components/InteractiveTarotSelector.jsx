"use client";
import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { ALL_CARDS } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import FocusModal from "@/components/FocusModal";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ShareCard from "@/components/ShareCard";
import logger from "@/lib/logger";

export default function InteractiveTarotSelector({ onClose, onComplete, spreadType = "three-card", readingType = "general", cardCount = null, question: initialQuestion = "", spreadId = null }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [reading, setReading] = useState(null);
  const [question, setQuestion] = useState(initialQuestion);
  const [showFocusModal, setShowFocusModal] = useState(false);
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
      "custom_spread": "custom_spread",
    };
    const id = spreadId || map[spreadType] || spreadType;
    const foundSpread = spreads.find(s => s.id === id) || spreads.find(s => s.id === "past_present_future");
    
    // For custom spread, update card_count and layout dynamically
    if (id === "custom_spread" && cardCount !== null && cardCount >= 1 && cardCount <= 10) {
      foundSpread.card_count = cardCount;
      foundSpread.layout = Array.from({ length: cardCount }, (_, i) => `Card ${i + 1}`);
      if (foundSpread.ui) {
        foundSpread.ui.required_selection_count = cardCount;
        foundSpread.ui.selection_labels = Array.from({ length: cardCount }, (_, i) => `Card ${i + 1}`);
      }
    }
    
    return foundSpread;
  })();

  const positions = spread.layout;

  useEffect(() => {
    // On mount and when spread changes, clear selections and prepare exactly N cards
    setSelectedCards([]);
    setError("");
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    const cardCountToUse = (spreadType === "custom_spread" && cardCount !== null) ? cardCount : spread.card_count;
    setAvailableCards(shuffled.slice(0, cardCountToUse));
    // Set initial question if provided
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [spreadType, cardCount]);

  const handleCardClick = (index) => {
    // If card is already selected, don't do anything
    if (selectedCards.includes(index)) return;
    
    // Add card to selected cards
    const newSelectedCards = [...selectedCards, index];
    setSelectedCards(newSelectedCards);
    
    // Question input is now handled by Focus Modal - no need to show legacy input
  };

  const handleGetReading = () => {
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

    // For custom spreads, if question is already provided, skip Focus Modal and go directly to API
    const isCustomSpread = spreadType === "custom_spread";
    if (isCustomSpread && question && question.trim()) {
      // Use the existing question directly
      handleFocusSubmit(question);
      return;
    }

    // For other spreads or if no question provided, open Focus Modal
    setShowFocusModal(true);
  };

  const handleFocusSubmit = async (userIntent) => {
    // Close the focus modal
    setShowFocusModal(false);
    
    // Update question state with user's intent
    setQuestion(userIntent);
    
    // If question was required but not provided, show error
    if (spread.ui?.require_question && !userIntent.trim()) {
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

      const res = await fetch("/api/readings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userIntent, // Use the intent from focus modal
          spreadType,
          readingType,
          specificCards: selectedCardsData,
          spreadId: spread.id,
          cardCount: (spreadType === "custom_spread" && cardCount !== null) ? cardCount : undefined
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setReading(data.reading);
        setShowReading(true);
      } else {
        // Handle errors
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
    setError("");
    
    // Shuffle and pick new cards
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    setAvailableCards(shuffled.slice(0, spread.card_count));
  };

  if (showReading && reading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="glassmorphic rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden apple-shadow-lg border border-white border-opacity-40">
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

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 border border-purple-100 overflow-hidden w-full max-w-full mb-0">
            <h3 className="font-semibold text-gray-900 mb-3 break-words">Interpretation</h3>
            <div className="w-full max-w-full break-words">
              <MarkdownRenderer text={reading.interpretation} className="text-gray-700 leading-relaxed break-words" />
            </div>
          </div>

          <ShareCard 
            interpretation={reading.interpretation} 
            readingId={reading.id}
            cards={reading.cards}
            onShareComplete={(credits) => {
              // Optionally show a toast notification
              console.info(`${credits} credits awarded for sharing!`);
            }}
          />

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
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
      <div className="glassmorphic rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto apple-shadow-lg border border-white border-opacity-40 my-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold gradient-text">Select Your Cards</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            {selectedCards.length === 0 && "Click on each card to reveal your destiny"}
            {selectedCards.length > 0 && selectedCards.length < positions.length && `${selectedCards.length} of ${positions.length} cards selected`}
            {selectedCards.length === positions.length && "All cards selected!"}
          </p>
          {error && (
            <p className="text-red-600 text-xs sm:text-sm mb-2">{error}</p>
          )}
        </div>

        <div className={`grid gap-3 sm:gap-4 md:gap-8 mb-4 sm:mb-6 md:mb-8 ${
            positions.length === 1 ? 'grid-cols-1' : 
            positions.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}>
          {Array.from({ length: spread.card_count }).map((_, index) => {
            const isSelected = selectedCards.includes(index);
            const selectionOrder = selectedCards.indexOf(index);
            
            return (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => handleCardClick(index)}
                  disabled={selectedCards.length === spread.card_count}
                  className={`
                    relative w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] aspect-[2/3] rounded-xl overflow-hidden mx-auto
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
            disabled={loading}
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
              "Start Reading"
            )}
          </button>
        )}

        {/* Focus Modal */}
        <FocusModal
          isOpen={showFocusModal}
          onClose={() => setShowFocusModal(false)}
          onSubmit={handleFocusSubmit}
          readingType={readingType}
        />

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Tarot readings are for entertainment and guidance purposes
          </p>
        </div>
      </div>
    </div>
    </>
  );
}