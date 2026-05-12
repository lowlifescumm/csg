const logger = require('./lib/logger');
"use client";
import { useState, useEffect } from "react";
import { Crown, Sparkles, Star, Heart, MessageCircle, Zap, Loader2, Check } from "lucide-react";

/**
 * PremiumCard - Soft upsell card for premium with value justification
 * 
 * Props:
 * - isPremium: Whether user is already premium (if true, don't show)
 * - variant: "short" | "long" | "auto" (default: "auto" - uses localStorage for A/B testing)
 * - onUpgrade: Optional callback when upgrade is triggered
 */
export default function PremiumCard({ isPremium, variant = "auto", onUpgrade }) {
  const [textVariant, setTextVariant] = useState("short");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // For A/B testing: use localStorage to persist variant
    if (variant === "auto") {
      const stored = localStorage.getItem("premiumCardVariant");
      if (stored === "short" || stored === "long") {
        setTextVariant(stored);
      } else {
        // Randomly assign variant on first visit
        const randomVariant = Math.random() < 0.5 ? "short" : "long";
        setTextVariant(randomVariant);
        localStorage.setItem("premiumCardVariant", randomVariant);
      }
    } else {
      setTextVariant(variant);
    }
  }, [variant]);

  // Don't show if user is already premium
  if (isPremium) {
    return null;
  }

  const handleUpgrade = async () => {
    setProcessing(true);
    if (onUpgrade) {
      onUpgrade();
    }

    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Failed to start subscription");
        setProcessing(false);
      }
    } catch (error) {
      logger.error("Subscription error:", error);
      alert("Failed to start subscription process");
      setProcessing(false);
    }
  };

  // Perks list
  const perks = [
    {
      icon: Sparkles,
      title: "Unlimited Readings",
      description: textVariant === "long" 
        ? "Access unlimited tarot readings, daily guidance, and spiritual insights without credit limits"
        : "Unlimited tarot readings without credit limits",
    },
    {
      icon: Star,
      title: "Full Birth Chart",
      description: textVariant === "long"
        ? "Generate detailed natal charts with comprehensive astrological analysis and downloadable visualizations"
        : "Detailed birth charts with comprehensive analysis",
    },
    {
      icon: Heart,
      title: "Relationship Reports",
      description: textVariant === "long"
        ? "Deep compatibility analysis with detailed relationship insights and astrological compatibility reports"
        : "Deep compatibility analysis and relationship insights",
    },
    {
      icon: MessageCircle,
      title: "Priority Advisor Chat",
      description: textVariant === "long"
        ? "Get priority access to AI-powered cosmic guidance, personalized interpretations, and transit analysis"
        : "Priority AI-powered cosmic guidance and interpretations",
    },
  ];

  // Headline variants
  const headline = textVariant === "long"
    ? "Unlock divine insights and transform your spiritual journey"
    : "Unlock divine insights";

  // Subheadline variants
  const subheadline = textVariant === "long"
    ? "Join thousands of spiritual seekers who have elevated their cosmic connection with premium features designed for deep transformation."
    : "Elevate your cosmic connection with unlimited access to all premium features.";

  return (
    <div className="relative glassmorphic rounded-3xl p-8 sm:p-10 apple-shadow-xl border border-white border-opacity-40 mb-8 overflow-hidden">
      {/* Glowing Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 rounded-3xl blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-orange-600/30 rounded-3xl" />
      
      {/* Animated Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30" style={{ animation: 'pulse 3s ease-in-out infinite' }} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 gradient-text">
            {headline}
          </h2>
          <p className="text-purple-200 text-lg sm:text-xl max-w-2xl mx-auto">
            {subheadline}
          </p>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {perks.map((perk, index) => {
            const Icon = perk.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 bg-white bg-opacity-10 rounded-xl p-4 sm:p-5 border border-white border-opacity-20 smooth-transition hover:bg-opacity-15"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{perk.title}</h3>
                  <p className="text-purple-200 text-sm leading-relaxed">{perk.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Benefits (Long variant only) */}
        {textVariant === "long" && (
          <div className="mb-8 bg-white bg-opacity-5 rounded-xl p-6 border border-white border-opacity-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1">4</div>
                <p className="text-purple-200 text-sm">Moon Readings/Month</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">2</div>
                <p className="text-purple-200 text-sm">Compatibility Reports/Month</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">Unlimited</div>
                <p className="text-purple-200 text-sm">Transit Dashboard</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            disabled={processing}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600 smooth-transition shadow-2xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Upgrade to Premium</span>
              </>
            )}
          </button>
          
          <p className="text-purple-300 text-sm mt-4">
            {textVariant === "long"
              ? "Secure payment powered by Stripe • Cancel anytime • $9.99/month"
              : "$9.99/month • Cancel anytime"}
          </p>
        </div>

        {/* Trust Indicators (Long variant only) */}
        {textVariant === "long" && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-purple-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>No credit card required for trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>24/7 support</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

