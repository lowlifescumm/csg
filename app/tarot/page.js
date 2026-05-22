"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Moon, ArrowRight, Lock, X, Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";
import TarotReadingTypePicker from "@/components/TarotReadingTypePicker";
import InteractiveTarotSelector from "@/components/InteractiveTarotSelector";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import PremiumTeaser, { parseInterpretationWithTeasers, getTeaserABVariant } from "@/components/PremiumTeaser";
import spreads from "@/lib/tarot-spreads.json";

export default function TarotPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [reading, setReading] = useState(null);
  const [savedReadingId, setSavedReadingId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0);

  const { loading: isSaving } = useApiClientWithToast(
    apiClient,
    (c) => c.post('/api/save-reading', {
      readingType: 'tarot',
      spreadType: selectedType?.name || 'Single Card',
      question: reading?.question,
      cards: reading?.cards,
      interpretation: reading?.interpretation,
      thumbnailCard: reading?.cards?.[0]?.name || 'The Fool',
    }, { timeout: 10_000 }),
    [saveVersion, reading, selectedType],
    {
      enabled: saveVersion > 0,
      onSuccess: (data) => {
        setSaveVersion(0);
        if (data.success) {
          setSavedReadingId(data.savedReading.id);
        } else {
          console.error('Failed to save reading:', data.error);
        }
      },
      onErrorWithToast: (error) => {
        setSaveVersion(0);
        if (error.status === 401) {
          setShowAuthModal(true);
          return false;
        }
        return 'Failed to save reading. Check your connection.';
      },
    },
  );
  const [isPremium, setIsPremium] = useState(null);
  const [creditsAvailable, setCreditsAvailable] = useState(0);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellContext, setUpsellContext] = useState(null);
  const [teaserABVariant, setTeaserABVariant] = useState("2");

  useEffect(() => {
    setTeaserABVariant(getTeaserABVariant());
  }, []);

  const { loading: loadingCredits, refetch: refetchCredits } = useApiClientWithToast(
    apiClient,
    (c) => c.get("/api/credits"),
    [],
    {
      onSuccess: (data) => {
        setIsPremium(data.isPremium || false);
        setCreditsAvailable(getAvailableCredits(data));
      },
      onError: () => {
        setIsPremium(false);
        setCreditsAvailable(0);
      },
      toastMessages: { error: "Could not check credit status." },
    },
  );

  const handleTypePick = (type) => {
    setSelectedType(type);
    setShowCardSelector(true);
    setReading(null);
  };

  const handleCardSelectorClose = () => {
    setShowCardSelector(false);
    setSelectedType(null);
  };

  const handleReadingComplete = (readingData) => {
    setReading(readingData);
    setShowCardSelector(false);
    refetchCredits();
  };

  const handleNewReading = () => {
    setReading(null);
    setSelectedType(null);
    setShowCardSelector(false);
    setSavedReadingId(null);
  };
  const handleSaveReading = () => {
    if (!reading || isSaving || savedReadingId) return;
    setSaveVersion(v => v + 1);
  };
  const getAvailableCredits = (creditData) => {
    if (typeof creditData?.credits === "number") return creditData.credits;
    if (typeof creditData?.ledgerBalance === "number") return creditData.ledgerBalance;
    if (typeof creditData?.stats?.totalAvailable === "number") return creditData.stats.totalAvailable;
    return 0;
  };

  const trackUpsellEvent = (eventName) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, {
        event_category: "tarot_upsell",
        event_label: selectedType?.spreadType || "tarot_result",
      });
    }
  };

  const handleDismissUpsell = () => {
    setShowUpsell(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("tarotUpsellDismissedUntil", String(Date.now() + 24 * 60 * 60 * 1000));
    }
    trackUpsellEvent("upsell_dismissed");
  };

  const handleUpsellClick = () => {
    trackUpsellEvent("upsell_clicked");
  };

  const shouldSuppressUpsell = () => {
    if (isPremium) return true;
    if (typeof window === "undefined") return true;

    const dismissedUntil = Number(localStorage.getItem("tarotUpsellDismissedUntil") || 0);
    return dismissedUntil > Date.now();
  };

  const openUpsell = (context = null) => {
    if (showUpsell || shouldSuppressUpsell()) return;
    setUpsellContext(context);
    setShowUpsell(true);
    trackUpsellEvent("upsell_shown");
  };

  const handleTeaserClick = (teaserPosition) => {
    const context = teaserPosition === "after_paragraph_2" ? "full_chart" : "transits";
    openUpsell(context);
    if (typeof window.gtag === "function") {
      window.gtag("event", "teaser_clicked", {
        event_category: "tarot_upsell",
        event_label: teaserPosition,
      });
    }
  };

  useEffect(() => {
    if (!reading) {
      setShowUpsell(false);
      return;
    }

    const timer = setTimeout(openUpsell, 10000);
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageBottom = document.documentElement.scrollHeight - 80;

      if (scrollPosition >= pageBottom) {
        openUpsell();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [reading, isPremium, selectedType?.spreadType, showUpsell]);


  if (loadingCredits) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (reading) {
    const spread = spreads.find((s) => s.id === selectedType?.spreadType) || spreads.find((s) => s.id === "past_present_future");
    const positions = spread?.layout || ["Card 1", "Card 2", "Card 3"];

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles className="w-10 h-10 text-yellow-300" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Your Tarot Reading</h1>
            <p className="text-xl text-purple-200">{selectedType?.title || "Tarot Reading"}</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {reading.cards?.map((card, i) => (
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
                {(() => {
                  const parsed = parseInterpretationWithTeasers(
                    reading.interpretation,
                    reading.cards,
                    teaserABVariant,
                    handleTeaserClick
                  );
                  return parsed.map((item, i) => {
                    if (item.type === "teaser") {
                      return (
                        <PremiumTeaser
                          key={`teaser-${i}`}
                          cards={reading.cards}
                          onClick={() => handleTeaserClick(item.position)}
                          variant={item.variant}
                          position={item.position}
                        />
                      );
                    }
                    return (
                      <div key={`p-${i}`} className="text-purple-100 leading-relaxed">
                        <MarkdownRenderer text={item.content} className="text-purple-100" />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveReading}
            disabled={isSaving || savedReadingId}
            className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-4 ${
              savedReadingId 
                ? 'bg-green-500 text-white cursor-default' 
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : savedReadingId ? (
              <>
                <BookmarkCheck className="w-5 h-5" />
                Saved to Journal
              </>
            ) : (
              <>
                <Bookmark className="w-5 h-5" />
                Save This Reading
              </>
            )}
          </button>

          <button
            onClick={handleNewReading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            New Reading
          </button>
        </div>

        {showUpsell && (
          <TarotUpsellModal
            reading={reading}
            creditsAvailable={creditsAvailable}
            onDismiss={handleDismissUpsell}
            onPrimaryClick={handleUpsellClick}
            onSecondaryClick={handleUpsellClick}
            context={upsellContext}
          />
        )}

        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Save Your Reading</h2>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Create a free account to save unlimited readings and access them anytime from your personal journal.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/auth/signin?callbackUrl=/tarot"
                  className="block w-full bg-purple-600 text-white text-center font-bold py-3 rounded-lg hover:bg-purple-700 transition-all"
                >
                  Sign In / Create Account
                </Link>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="block w-full bg-gray-100 text-gray-700 text-center font-bold py-3 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Continue Without Saving
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Tarot Readings</h1>
          <p className="text-xl text-purple-200">Choose your spread and let the cards reveal their wisdom</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Select a Reading Type</h2>
          <TarotReadingTypePicker onPick={handleTypePick} />
        </div>

        <div className="mt-8 text-center text-purple-200 text-sm">
          {isPremium ? (
            <p>Premium member - unlimited readings</p>
          ) : (
            <p>Basic tarot readings are free</p>
          )}
        </div>

        {/* Related Services - Internal Linking */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Enhance Your Tarot Practice</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/birth-chart" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⭐</span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-purple-300">Get Your Birth Chart</h3>
              </div>
              <p className="text-purple-200 text-sm">Combine tarot wisdom with your astrological blueprint</p>
              <span className="text-purple-400 text-sm flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                Free Birth Chart <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link href="/moon-reading" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white group-hover:text-purple-300">Add Moon Energy</h3>
              </div>
              <p className="text-purple-200 text-sm">See how lunar phases influence your tarot readings</p>
              <span className="text-purple-400 text-sm flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                Moon Reading <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {showCardSelector && selectedType && (
        <InteractiveTarotSelector
          onClose={handleCardSelectorClose}
          onComplete={handleReadingComplete}
          spreadType={selectedType.spreadType}
          spreadId={selectedType.spreadType}
          readingType="general"
        />
      )}
    </div>
  );
}

function TarotUpsellModal({ reading, creditsAvailable, onDismiss, onPrimaryClick, onSecondaryClick, context }) {
  const hasCredits = creditsAvailable >= 2;
  const lockedInsights = buildLockedInsights(reading?.cards || []);

  // Adjust CTA based on context from teaser
  const getPrimaryCTA = () => {
    if (!hasCredits) return "Get 10 Credits — $9.99";
    if (context === "full_chart") return "Continue to Full Chart — 2 credits";
    if (context === "transits") return "See Your Transits — 2 credits";
    return "Unlock My Full Chart — 2 credits";
  };

  const getPrimaryHref = () => {
    if (!hasCredits) return "/credits";
    if (context === "transits") return "/forecasts";
    return "/birth-chart";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="relative w-full md:max-w-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 border-t md:border border-yellow-300/30 shadow-2xl shadow-purple-950/60 rounded-t-3xl md:rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-purple-200 hover:text-white transition"
          aria-label="Dismiss upsell"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="inline-flex items-center gap-2 bg-yellow-300/10 text-yellow-200 border border-yellow-300/30 rounded-full px-3 py-1 text-sm font-semibold mb-5">
          <Lock className="w-4 h-4" />
          Deeper insight available
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 pr-8">
          This reading used 3 cards. Your full chart uses 12 houses, 10 planets, and current transits.
        </h2>

        <p className="text-purple-100 mb-5">
          Your cards opened the door. The full chart shows where this pattern lives in your actual birth map — and what timing is activating it now.
        </p>

        <div className="space-y-3 mb-6">
          {lockedInsights.map((insight, index) => (
            <div key={index} className="flex gap-3 rounded-2xl bg-white/10 border border-white/10 p-4">
              <Lock className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base text-purple-50">{insight}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          <Link
            href={getPrimaryHref()}
            onClick={onPrimaryClick}
            className="w-full text-center bg-gradient-to-r from-yellow-300 to-amber-500 text-purple-950 font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-yellow-900/20"
          >
            {getPrimaryCTA()}
          </Link>

          <Link
            href="/login?next=/tarot"
            onClick={onSecondaryClick}
            className="w-full text-center bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 border border-white/15 transition-all"
          >
            Save This Reading
          </Link>

          <button
            onClick={onDismiss}
            className="w-full text-purple-200 font-semibold py-3 rounded-xl hover:text-white transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

function buildLockedInsights(cards) {
  const selectedCards = cards.slice(0, 3);
  const fallback = [
    "Your 12th house pattern reveals why this emotional cycle keeps repeating beneath the surface.",
    "Your current transits show when this energy peaks — and when to act instead of waiting.",
    "Your Venus and Moon placements explain what this reading says about love, safety, and timing specifically for you.",
  ];

  if (selectedCards.length === 0) return fallback;

  return selectedCards.map((card, index) => {
    const name = card?.name || `Card ${index + 1}`;
    const reversed = card?.reversed ? " reversed" : "";
    const lowerName = name.toLowerCase();

    if (lowerName.includes("hermit") && card?.reversed) {
      return "Your 12th house placement reveals WHY isolation feels chaotic for you specifically — not peaceful.";
    }

    if (lowerName.includes("lovers")) {
      return `Your Venus placement shows what ${name}${reversed} is really asking you to choose in love and commitment.`;
    }

    if (lowerName.includes("tower")) {
      return `Your current transits reveal whether ${name}${reversed} is a breakdown, breakthrough, or overdue course correction.`;
    }

    if (lowerName.includes("moon")) {
      return `Your natal Moon house explains why ${name}${reversed} feels intuitive in one moment and confusing in the next.`;
    }

    return `Your full chart reveals the house and planetary trigger behind ${name}${reversed} — the part a 3-card reading can only hint at.`;
  });
}

