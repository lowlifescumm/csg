"use client";
const logger = require('../lib/logger');
import { useState } from "react";
import { Share2, Instagram, Twitter, Copy, Check, Sparkles, Star, Loader2 } from "lucide-react";
import { useSocialShare } from "@/src/hooks/useSocialShare";
import logger from "@/lib/logger";

/**
 * ShareCard - Component for sharing tarot reading on social media
 * 
 * Props:
 * - interpretation: The full reading interpretation text
 * - readingId: The ID of the reading being shared
 * - cards: Array of card objects with { name, image, reversed } (optional, for image sharing)
 * - onShareComplete: Callback when share is completed (deprecated - now handled by hook)
 */
export default function ShareCard({ interpretation, readingId, cards = [], onShareComplete }) {
  const { shareContent, isSharing, platform } = useSocialShare();
  const [copied, setCopied] = useState(false);

  // Extract Power Move from interpretation (typically the last paragraph)
  const extractPowerMove = (text) => {
    if (!text) return "";
    
    // Split by double newlines to get paragraphs
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    
    // Power Move is usually at the end, look for last substantial paragraph
    // Or paragraphs containing "Power Move", "ritual", "today", etc.
    const powerMoveKeywords = ["power move", "ritual", "today", "action", "practice"];
    
    // First, try to find paragraph explicitly mentioning Power Move
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const lower = paragraphs[i].toLowerCase();
      if (powerMoveKeywords.some(keyword => lower.includes(keyword))) {
        return paragraphs[i];
      }
    }
    
    // If not found, return last paragraph (which should be the Power Move per prompt)
    return paragraphs[paragraphs.length - 1] || "";
  };

  const powerMove = extractPowerMove(interpretation);

  // Extract card names for share text
  const getCardNames = () => {
    if (!cards || cards.length === 0) return "";
    return cards.map((card, i) => {
      const position = ["Past", "Present", "Future"][i] || `Position ${i + 1}`;
      return `${position}: ${card.name}${card.reversed ? " (Reversed)" : ""}`;
    }).join(", ");
  };

  // Main share handler using useSocialShare hook
  const handleShareReading = async () => {
    // Extract card image URLs
    const imageUrls = cards && cards.length > 0 
      ? cards.map(card => card.image).filter(Boolean)
      : [];

    // Create share text (no URL - reading URLs are blocked by permissions)
    const cardNames = getCardNames();
    const shareText = `✨ My Cosmic Guidance from Cosmic Spirit Guide! ${cardNames ? `\n\nCards: ${cardNames}` : ""}\n\n${powerMove}\n\nGet your reading at cosmicspiritguide.com`;

    try {
      await shareContent({
        title: "My Cosmic Guidance",
        text: shareText,
        url: "https://cosmicspiritguide.com", // Use main site URL instead of reading URL
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
    } catch (error) {
      console.error("[ShareCard] Share error:", error);
      // Error handling is done in the hook
    }
  };

  // Copy link to clipboard (fallback)
  const handleCopyLink = async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/readings/${readingId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Desktop-specific share buttons (fallback for unsupported platforms)
  const handleShareFacebook = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/readings/${readingId}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleShareTwitter = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/readings/${readingId}`;
    const shareText = encodeURIComponent("✨ My Cosmic Guidance from Cosmic Spirit Guide!");
    const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  if (!powerMove) return null;

  return (
    <div className="w-full max-w-full overflow-hidden mt-0">
      {/* Visible Share Card (shown to users) */}
      <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 rounded-3xl p-8 border border-white border-opacity-20 relative overflow-hidden w-full max-w-full">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 opacity-10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-white break-words">Share Your Insight!</h2>
              <p className="text-purple-200 text-sm break-words">Share & Get 3 Bonus Credits!</p>
            </div>
          </div>

          {/* Main Share Button - Uses useSocialShare hook */}
          <button
            onClick={handleShareReading}
            disabled={isSharing}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Share Reading
              </>
            )}
          </button>

          {/* Platform indicator */}
          {platform && (
            <div className="mb-3 text-center text-sm text-purple-200">
              {platform === 'native' && '✓ Shared via native share'}
              {platform === 'clipboard' && '✓ Copied to clipboard! Paste on your social media.'}
            </div>
          )}

          {/* Desktop-specific share buttons (optional fallback) */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <button
              onClick={handleShareFacebook}
              disabled={isSharing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium smooth-transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Facebook
            </button>

            <button
              onClick={handleShareTwitter}
              disabled={isSharing}
              className="flex-1 bg-black hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-medium smooth-transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Twitter className="w-4 h-4" />
              X (Twitter)
            </button>

            <button
              onClick={handleCopyLink}
              disabled={isSharing}
              className="sm:w-auto px-4 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-xl font-medium smooth-transition border border-white border-opacity-30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
