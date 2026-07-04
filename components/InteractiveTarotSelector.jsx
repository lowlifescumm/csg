"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, Mail } from "lucide-react";
import { ALL_CARDS } from "@/lib/tarot-data";
import spreads from "@/lib/tarot-spreads.json";
import FocusModal from "@/components/FocusModal";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ShareCard from "@/components/ShareCard";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";

export default function InteractiveTarotSelector({ onClose, onComplete, spreadType = "three-card", readingType = "general", cardCount = null, question: initialQuestion = "", spreadId = null, user = null }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [showReading, setShowReading] = useState(false);
  const [reading, setReading] = useState(null);
  const [question, setQuestion] = useState(initialQuestion);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [error, setError] = useState("");
  const [flashMismatch, setFlashMismatch] = useState(false);
  const [submitVersion, setSubmitVersion] = useState(0);
  const [submitIntent, setSubmitIntent] = useState("");
  const [submitCardData, setSubmitCardData] = useState(null);
  // Email capture gate state
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailGatePending, setEmailGatePending] = useState(false);
  const [emailGateError, setEmailGateError] = useState("");

  const { loading } = useApiClientWithToast(
    apiClient,
    (c) => c.post("/api/readings/create", submitCardData, { timeout: 90_000 }),
    [submitVersion, submitCardData],
    {
      enabled: submitVersion > 0,
      onSuccess: (data) => {
        setSubmitVersion(0);
        if (data.success) {
          setReading(data.reading);
          setShowReading(true);
          if (onComplete) {
            onComplete(data.reading);
          }
        }
      },
      toastMessages: { error: "Failed to generate reading. Check your connection." },
    },
  );
  
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
    const resolvedFromType = map[spreadType] || spreadType;
    const id = spreadId || resolvedFromType;
    const foundSpread = spreads.find(s => s.id === id) || spreads.find(s => s.id === "past_present_future");
    const spreadClone = foundSpread ? JSON.parse(JSON.stringify(foundSpread)) : null;
    
    if (id === "custom_spread" && spreadClone && cardCount !== null && cardCount >= 1 && cardCount <= 10) {
      spreadClone.card_count = cardCount;
      spreadClone.layout = Array.from({ length: cardCount }, (_, i) => `Card ${i + 1}`);
      if (spreadClone.ui) {
        spreadClone.ui.required_selection_count = cardCount;
        spreadClone.ui.selection_labels = Array.from({ length: cardCount }, (_, i) => `Card ${i + 1}`);
      }
    }
    
    return spreadClone;
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

  const isAnonymous = !user || !user.id;

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

    // For anonymous users, show email gate before proceeding
    if (isAnonymous) {
      setShowEmailGate(true);
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

  const handleEmailGateSubmit = async (skip = false) => {
    setEmailGateError("");
    
    if (!skip) {
      // Validate email
      const trimmedEmail = emailInput.trim();
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setEmailGateError("Please enter a valid email address");
        return;
      }
      
      setEmailGatePending(true);
      
      try {
        // Capture the lead
        await apiClient.post("/api/leads/capture", {
          email: trimmedEmail,
          source: "tarot_reading_gate",
          question: question || null,
        });
        
        // Track email capture event
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'email_captured', {
            event_category: 'engagement',
            event_label: 'tarot_reading_gate',
          });
        }
      } catch (err) {
        console.error("Failed to capture email:", err);
        // Continue anyway - don't block the user from seeing their reading
      } finally {
        setEmailGatePending(false);
      }
    }
    
    // Close email gate and proceed to focus modal or directly to reading
    setShowEmailGate(false);
    
    // For custom spreads with question, go directly to reading
    const isCustomSpread = spreadType === "custom_spread";
    if (isCustomSpread && question && question.trim()) {
      handleFocusSubmit(question);
      return;
    }
    
    // Otherwise show focus modal
    setShowFocusModal(true);
  };

  const handleFocusSubmit = (userIntent) => {
    setShowFocusModal(false);
    setQuestion(userIntent);

    if (spread.ui?.require_question && !userIntent.trim()) {
      setError("Please enter your question before submitting.");
      return;
    }

    const selectedCardsData = selectedCards.map((index) => ({
      ...availableCards[index],
      reversed: Math.random() > 0.5,
      position: positions[selectedCards.indexOf(index)],
    }));

    setSubmitCardData({
      question: userIntent,
      spreadType,
      readingType,
      specificCards: selectedCardsData,
      spreadId: spread.id,
      cardCount: (spreadType === "custom_spread" && cardCount !== null) ? cardCount : undefined,
    });
    setSubmitVersion((v) => v + 1);
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

        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none resize-none text-gray-900 placeholder-gray-400 bg-white bg-opacity-70"
            rows={2}
            placeholder="What guidance do you seek today?"
          />
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

        {/* Email Gate Modal */}
        {showEmailGate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="glassmorphic rounded-3xl p-6 sm:p-8 max-w-md w-full apple-shadow-xl border border-white border-opacity-40 bg-gradient-to-br from-violet-900/90 via-purple-900/90 to-indigo-900/90">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Your Reading Awaits</h2>
                    <p className="text-purple-200 text-sm mt-1">Enter your email to see your full reading</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailGate(false);
                    setEmailInput("");
                    setEmailGateError("");
                  }}
                  className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 smooth-transition text-white"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium text-purple-200 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEmailGateSubmit(false);
                      }
                    }}
                    placeholder="you@example.com"
                    className="w-full p-4 rounded-xl border border-white border-opacity-30 bg-white bg-opacity-10 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 outline-none smooth-transition"
                    autoFocus
                    disabled={emailGatePending}
                  />
                  {emailGateError && (
                    <p className="text-red-300 text-sm mt-2">{emailGateError}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => handleEmailGateSubmit(false)}
                    disabled={emailGatePending}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {emailGatePending ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Show My Reading
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEmailGateSubmit(true)}
                    disabled={emailGatePending}
                    className="w-full px-6 py-3 bg-transparent hover:bg-white/10 text-purple-200 hover:text-white rounded-xl font-medium smooth-transition border border-white/20 transition-all"
                  >
                    No thanks, just show my reading
                  </button>
                </div>

                <p className="text-xs text-center text-purple-300 mt-4">
                  We&apos;ll send you occasional cosmic insights. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
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