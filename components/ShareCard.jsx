"use client";
import { useRef, useState, useEffect } from "react";
import { Share2, Instagram, Twitter, Copy, Check, Sparkles, Star } from "lucide-react";
import html2canvas from "html2canvas";
import MarkdownRenderer from "./MarkdownRenderer";

/**
 * ShareCard - Component for sharing tarot reading Power Move on social media
 * 
 * Props:
 * - interpretation: The full reading interpretation text
 * - readingId: The ID of the reading being shared
 * - onShareComplete: Callback when share is completed (to award credits)
 */
export default function ShareCard({ interpretation, readingId, onShareComplete }) {
  const shareCardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creditsAwarded, setCreditsAwarded] = useState(false);

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

  // Generate image from share card
  const generateImage = async () => {
    if (!shareCardRef.current || isGenerating) return null;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#1e1b4b",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          setIsGenerating(false);
          resolve(blob);
        }, "image/png", 1.0);
      });
    } catch (error) {
      console.error("Error generating image:", error);
      setIsGenerating(false);
      return null;
    }
  };

  // Share to Instagram (download image for manual upload)
  const handleShareInstagram = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cosmic-power-move-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Track share
    await trackShare();
  };

  // Share to Twitter/X
  const handleShareTwitter = async () => {
    const blob = await generateImage();
    if (!blob) return;

    // Create share link with text (Twitter allows image upload via URL)
    const shareText = encodeURIComponent("✨ My Cosmic Power Move from Cosmic Spirit Guide");
    const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
    
    // For now, download image and open Twitter with text
    // In production, you'd upload to a CDN and include image URL
    window.open(shareUrl, "_blank");

    // Track share
    await trackShare();
  };

  // Copy link to clipboard
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

  // Track share and award credits
  const trackShare = async () => {
    if (creditsAwarded || !readingId) return;

    try {
      const response = await fetch("/api/share/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId }),
      });

      const data = await response.json();
      if (data.success) {
        setCreditsAwarded(true);
        if (onShareComplete) {
          onShareComplete(3); // Award 3 credits
        }
      }
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  // Handle "I've Shared" button for manual confirmation
  const handleManualShare = async () => {
    await trackShare();
  };

  if (!powerMove) return null;

  return (
    <div className="w-full max-w-full overflow-hidden mt-0">
      {/* Share Card (for image generation) - Hidden but accessible to html2canvas */}
      <div
        ref={shareCardRef}
        className="hidden md:block"
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #7c3aed 100%)",
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 opacity-10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
          <div className="text-center text-purple-200 text-sm">
            Get your reading at cosmicspiritguide.com
          </div>
        </div>
      </div>

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

          {/* Share Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleShareInstagram}
              disabled={isGenerating || creditsAwarded}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Instagram className="w-5 h-5" />
                  Share Image
                </>
              )}
            </button>

            <button
              onClick={handleShareTwitter}
              disabled={isGenerating || creditsAwarded}
              className="flex-1 bg-black text-white py-4 px-6 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Twitter className="w-5 h-5" />
              Share on X
            </button>

            <button
              onClick={handleCopyLink}
              className="sm:w-auto px-6 py-4 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-xl font-medium smooth-transition border border-white border-opacity-30 flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Manual Share Confirmation (fallback) */}
          {!creditsAwarded && (
            <button
              onClick={handleManualShare}
              className="mt-4 w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-3 px-6 rounded-xl font-medium smooth-transition border border-white border-opacity-30"
            >
              I've Shared! (Claim 3 Credits)
            </button>
          )}

          {/* Success Message */}
          {creditsAwarded && (
            <div className="mt-4 p-4 bg-green-500 bg-opacity-20 border border-green-400 rounded-xl text-green-200 text-center">
              ✓ 3 Credits Added to Your Account!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
