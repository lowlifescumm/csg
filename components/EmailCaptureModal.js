"use client";

import { useState } from "react";
import { X, Sparkles, Mail } from "lucide-react";

export default function EmailCaptureModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    
    // TODO: Integrate with email service (Resend, Mailchimp, etc.)
    // For now, simulate success
    setTimeout(() => {
      setStatus("success");
      // Store in localStorage to not show again
      localStorage.setItem("csg_email_captured", "true");
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-cosmic-indigo border border-cosmic-gold/30 rounded-2xl p-8 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-cosmic-gold/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-cosmic-gold" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              You're In!
            </h3>
            <p className="text-white/70">
              Check your inbox for your free 7-Day Tarot Mastery Guide.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-cosmic-gold/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cosmic-gold" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                Before You Go...
              </h3>
              <p className="text-white/70 mb-2">
                Get Your Free
              </p>
              <p className="text-xl text-cosmic-gold font-semibold">
                7-Day Tarot Mastery Guide
              </p>
            </div>
            
            <ul className="text-sm text-white/60 mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-cosmic-gold">✓</span> Daily card meanings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cosmic-gold">✓</span> 3-card spread techniques
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cosmic-gold">✓</span> Journaling prompts
              </li>
            </ul>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-cosmic-gold/50 transition-colors"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-6 py-3 rounded-lg font-semibold bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 transition-all disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Me The Guide"}
              </button>
              
              <p className="text-xs text-white/40 text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
