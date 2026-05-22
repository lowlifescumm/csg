"use client";

import { useState, useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";

/**
 * PremiumTeaser - Inline premium upsell teaser component
 * 
 * Renders an inline callout box that feels like a natural continuation
 * of the reading, but teases deeper premium insights.
 * 
 * Props:
 * - cards: The cards pulled in the reading (for generating contextual teasers)
 * - onClick: Callback when user clicks to unlock
 * - variant: Which teaser variant to show (based on cards)
 * - position: "after_paragraph_2" | "after_power_move"
 * - abVariant: "1" or "2" — how many teasers this user sees (for A/B testing)
 */
export default function PremiumTeaser({ cards = [], onClick, variant = 0, position = "after_paragraph_2" }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Slight delay for entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Generate teaser content based on cards and position
  const teaserContent = generateTeaserContent(cards, variant, position);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border my-6
        transition-all duration-700 ease-out transform
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${position === "after_paragraph_2" ? "border-amber-400/40" : "border-purple-400/40"}
      `}
      style={{
        background: position === "after_paragraph_2"
          ? "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(147,51,234,0.06) 100%)"
          : "linear-gradient(135deg, rgba(147,51,234,0.08) 0%, rgba(251,191,36,0.06) 100%)",
        boxShadow: position === "after_paragraph_2"
          ? "0 0 20px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "0 0 20px rgba(147,51,234,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Subtle animated glow effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: position === "after_paragraph_2"
            ? "radial-gradient(circle at 30% 50%, rgba(251,191,36,0.3) 0%, transparent 60%)"
            : "radial-gradient(circle at 70% 50%, rgba(147,51,234,0.3) 0%, transparent 60%)",
        }}
      />

      <div className="relative p-5">
        <div className="flex items-start gap-3">
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
            style={{
              background: position === "after_paragraph_2"
                ? "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.1))"
                : "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(147,51,234,0.1))",
            }}
          >
            <Lock className="w-4 h-4 text-amber-300" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-purple-100/90 text-sm leading-relaxed">
              {teaserContent}
            </p>

            <button
              onClick={onClick}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold group transition-all duration-300"
              style={{
                color: position === "after_paragraph_2" ? "#fbbf24" : "#c084fc",
              }}
            >
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="group-hover:underline underline-offset-2">
                {position === "after_paragraph_2" ? "Unlock in Full Chart" : "See Your Transits"}
              </span>
              <svg 
                className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom border accent */}
      <div 
        className="h-0.5"
        style={{
          background: position === "after_paragraph_2"
            ? "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)"
            : "linear-gradient(90deg, transparent, rgba(147,51,234,0.5), transparent)",
        }}
      />
    </div>
  );
}

/**
 * Generate contextual teaser content based on the cards in the reading
 */
function generateTeaserContent(cards, variant, position) {
  const selectedCards = cards.slice(0, 3);
  
  if (selectedCards.length === 0) {
    return position === "after_paragraph_2"
      ? "Your Mars sign reveals WHY this pattern keeps repeating — not just that it does. The full chart maps this to your actual birth energies."
      : "Saturn's current transit through your chart explains the 'stuck' feeling you're sensing. See the exact dates and how long it lasts.";
  }

  // Get card names for context
  const cardNames = selectedCards.map(c => c.name?.toLowerCase() || "");
  const hasReversed = selectedCards.some(c => c.reversed);

  // Position 1: After 2nd paragraph — focus on WHY behind the cards
  if (position === "after_paragraph_2") {
    const teasers = [
      "Your Mars sign reveals WHY this pattern keeps repeating — not just that it does. The full chart maps this to your actual birth energies.",
      "The house placement of these cards in YOUR chart reveals where this energy actually lives — not just what it means in general.",
      "Your Venus placement shows why these cards are showing up NOW for you specifically, not just what they mean universally.",
      `The ${hasReversed ? "reversed" : "upright"} energy of ${cardNames[0] || "this card"} connects directly to your 4th house pattern — see how in the full chart.`,
    ];
    return teasers[variant % teasers.length];
  }

  // Position 2: After "Power Move" section — focus on timing and action
  const timingTeasers = [
    "Saturn's current transit through your chart explains the 'stuck' feeling. See the exact dates and when it shifts.",
    "Your current Jupiter transits reveal when this opportunity window opens and closes. Exact dates in your transit report.",
    `The timing of ${cardNames[0] || "this card"} appearance aligns with a specific transit in your chart right now. See which planet and when.`,
    "Mercury's upcoming retrograde will reactivate this exact pattern. See the dates and how to navigate it in your transit calendar.",
  ];
  return timingTeasers[variant % timingTeasers.length];
}

/**
 * Parse interpretation text and determine where to insert teasers
 * Returns an array of objects: { type: "paragraph" | "teaser", content }
 */
export function parseInterpretationWithTeasers(interpretation, cards, abVariant = "2", onTeaserClick) {
  if (!interpretation) return [];

  // Split into paragraphs
  const paragraphs = interpretation.split(/\n\n+/).filter(p => p.trim());
  
  const result = [];
  let teaserCount = 0;
  const maxTeasers = abVariant === "1" ? 1 : 2;

  paragraphs.forEach((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return;

    // Add the paragraph
    result.push({ type: "paragraph", content: trimmed });

    // Check if we should insert a teaser after this paragraph
    const isAfterParagraph2 = index === 1 && maxTeasers >= 1;
    const isAfterPowerMove = trimmed.toLowerCase().includes("power move") && maxTeasers >= 2;

    if (isAfterParagraph2 && teaserCount < maxTeasers) {
      result.push({
        type: "teaser",
        position: "after_paragraph_2",
        variant: teaserCount,
        onClick: onTeaserClick,
      });
      teaserCount++;
    }

    if (isAfterPowerMove && teaserCount < maxTeasers) {
      result.push({
        type: "teaser",
        position: "after_power_move",
        variant: teaserCount,
        onClick: onTeaserClick,
      });
      teaserCount++;
    }
  });

  return result;
}

/**
 * Get A/B test variant for current user
 * "1" = show 1 teaser, "2" = show 2 teasers
 */
export function getTeaserABVariant() {
  if (typeof window === "undefined") return "2";

  // Check for existing assignment
  const stored = localStorage.getItem("tarot_teaser_ab_variant");
  if (stored === "1" || stored === "2") return stored;

  // Random assignment: 50/50 split
  const variant = Math.random() < 0.5 ? "1" : "2";
  localStorage.setItem("tarot_teaser_ab_variant", variant);

  // Track assignment for analytics
  if (typeof window.gtag === "function") {
    window.gtag("event", "teaser_ab_assigned", {
      event_category: "tarot_upsell",
      event_label: `teaser_count_${variant}`,
    });
  }

  return variant;
}
