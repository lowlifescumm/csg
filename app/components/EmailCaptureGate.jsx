"use client";

import { useState } from "react";
import { Sparkles, Mail, Lock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

/**
 * EmailCaptureGate
 * A modal that captures email before revealing the full reading content
 * Used to generate leads and enable nurture sequences
 */

export default function EmailCaptureGate({
  readingId,
  readingType = "tarot",
  onEmailSubmit,
  onSkip,
  isOpen = true,
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Store the pending reading email
      await apiClient.post("/api/pending-reading-emails", {
        email,
        name: name || null,
        readingId,
        readingType,
        capturedAt: new Date().toISOString(),
      });

      setSubmitted(true);
      onEmailSubmit?.({ email, name });
    } catch (err) {
      setError("Failed to save your email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-indigo-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-white border-opacity-20 shadow-2xl">
        {!submitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full mb-4">
                <Mail className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Reveal Your Full Reading
              </h2>
              <p className="text-purple-200">
                Enter your email to unlock your complete {readingType} reading
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-6">
              <ul className="text-purple-200 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Get detailed interpretation
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Save readings to your account
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Free daily horoscope updates
                </li>
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">
                  Your Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-300 text-sm mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-yellow-400"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Unlocking..." : "Reveal My Reading"}
              </button>
            </form>

            {/* Skip option */}
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full text-center text-purple-400 text-sm mt-4 hover:text-purple-300"
              >
                Skip for now →
              </button>
            )}

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-2 text-purple-400 text-xs mt-6">
              <Lock className="w-3 h-3" />
              We respect your privacy. Unsubscribe anytime.
            </div>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-20 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">All Set!</h2>
            <p className="text-purple-200">
              Your reading is being revealed. Check your email for a copy!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
