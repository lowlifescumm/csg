"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Clock, Gift, Percent, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * ExitIntentPopup - Displays a modal when user is about to leave
 * Triggers on mouse leave viewport (desktop) or scroll up (mobile)
 * Shows discount offer for compatibility report
 */
export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [hasShown, setHasShown] = useState(false);

  // Check if popup should be shown (cookie/session check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check localStorage to prevent showing multiple times per session
    const sessionShown = sessionStorage.getItem("csg_exit_intent_shown");
    if (sessionShown) {
      setHasShown(true);
      return;
    }

    // Check if user has already purchased
    const hasPurchased = localStorage.getItem("csg_has_purchased");
    if (hasPurchased) {
      setHasShown(true);
      return;
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Desktop: detect mouse leaving viewport
  const handleMouseLeave = useCallback((e) => {
    // Only trigger if mouse leaves at the top of the viewport
    if (e.clientY <= 0 && !hasShown) {
      showPopup();
    }
  }, [hasShown]);

  // Mobile: detect scroll up with velocity
  let lastScrollY = 0;
  let scrollVelocity = 0;
  const scrollThreshold = 200; // pixels to scroll up
  const velocityThreshold = -200; // pixels/second

  const handleScroll = useCallback(() => {
    if (typeof window === "undefined" || hasShown) return;

    const currentScrollY = window.scrollY;
    const deltaY = currentScrollY - lastScrollY;
    const deltaTime = 100; // assume ~100ms between calls
    
    // Calculate velocity (pixels per second)
    scrollVelocity = (deltaY / deltaTime) * 1000;

    // Trigger on fast scroll up OR reaching top of page
    if ((scrollVelocity < velocityThreshold || currentScrollY < scrollThreshold) && deltaY < 0) {
      showPopup();
    }

    lastScrollY = currentScrollY;
  }, [hasShown]);

  const showPopup = () => {
    if (hasShown) return;
    
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 50);
    
    // Mark as shown for this session
    if (typeof window !== "undefined") {
      sessionStorage.setItem("csg_exit_intent_shown", "true");
    }
    setHasShown(true);

    // Track display event (could send to analytics)
    console.log("Exit intent popup displayed");
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    // Store email
    if (typeof window !== "undefined") {
      localStorage.setItem("csg_exit_intent_email", email);
      localStorage.setItem("csg_email_captured", "true");
    }
    
    setEmailCaptured(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Setup event listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Desktop: mouse leave
    document.addEventListener("mouseleave", handleMouseLeave);
    
    // Mobile: scroll detection
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleMouseLeave, handleScroll]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isAnimating ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-lg bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 
          border border-white/20 rounded-2xl p-8 shadow-2xl overflow-hidden
          transform transition-all duration-300
          ${isAnimating ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}
        `}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cosmic-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10"
          aria-label="Close popup"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Wait! Don't Leave Empty-Handed
            </h2>
            <p className="text-white/70">
              Get 25% off your personalized compatibility report
            </p>
          </div>

          {/* Discount badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-xl px-6 py-3 rounded-full flex items-center gap-2">
              <Percent className="w-5 h-5" />
              25% OFF
            </div>
          </div>

          {/* Urgency timer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-center gap-2 text-center">
              <Clock className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-white font-semibold">
                Offer expires in: {" "}
                <span className="text-red-400 font-mono text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </span>
            </div>
          </div>

          {/* Features */}
          <ul className="text-white/80 mb-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Detailed compatibility analysis
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Relationship strengths & challenges
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Instant PDF download
            </li>
          </ul>

          {/* Email capture or CTA */}
          {!emailCaptured ? (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-3 mb-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for the discount code..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400/50 transition-colors"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Get My 25% Off Coupon
                </button>
              </form>
              
              <button
                onClick={handleClose}
                className="w-full text-white/50 hover:text-white text-sm transition-colors"
              >
                No thanks, I'll pay full price
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Coupon Code Sent!
              </h3>
              <p className="text-white/70 mb-4">
                Check your inbox for code <strong className="text-yellow-400">EXIT25</strong>
              </p>
              <Link
                href="/compatibility"
                className="block w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:opacity-90 transition-all text-center"
              >
                Get My Compatibility Report
              </Link>
            </div>
          )}

          {/* Trust indicators */}
          <p className="text-xs text-white/40 text-center mt-4">
            Secure checkout • Instant delivery • 30-day money back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
