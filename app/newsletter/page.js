"use client";
const logger = require('../../lib/logger');

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewsletterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDownloadUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "You’re in! Check your email for your guide.");
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
        }
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      logger.error("[Newsletter] subscribe error:", err);
      setError("Failed to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left: Hero / Copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4">
            <span className="text-xs text-purple-200">Lead Magnet</span>
            <span className="text-xs text-purple-100 font-semibold">Free Cosmic PDF</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight mb-4">
            Unlock Your <span className="gradient-text">Cosmic Spirit Guide</span>
          </h1>
          <p className="text-purple-100 text-sm sm:text-base leading-relaxed mb-6">
            Join the Cosmic Spirit Guide newsletter and receive an exclusive PDF guide
            designed to deepen your intuition, connect with your spirit guides, and
            bring more synchronicity into your everyday life.
          </p>
          <ul className="space-y-2 text-purple-100 text-sm mb-6">
            <li>✨ Step-by-step practices to connect with your higher guidance</li>
            <li>🌙 Rituals you can use with the moon and your birth chart</li>
            <li>🔐 Instant access link to your PDF after signup</li>
          </ul>
          <div className="hidden lg:block rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-purple-100">
              We respect your inbox. Expect only soulful, high-value updates — no spam,
              no fluff, and you can unsubscribe at any time with a single click.
            </p>
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white/20 bg-gradient-to-br from-slate-900/80 via-indigo-950/80 to-purple-950/80">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 mb-3">
              <span className="text-2xl">📥</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-1">Get Your Free Guide</h2>
            <p className="text-purple-200 text-xs sm:text-sm">
              Enter your details to receive the download link and future cosmic updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-xs font-medium text-purple-100 mb-2"
              >
                First Name (optional)
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                className="w-full p-3 rounded-xl border border-white/15 bg-slate-950/60 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none smooth-transition"
                placeholder="How should we greet you?"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-purple-100 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full p-3 rounded-xl border border-white/15 bg-slate-950/60 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none smooth-transition"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400/40 text-red-200 px-4 py-3 rounded-xl text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-400/40 text-emerald-100 px-4 py-3 rounded-xl text-xs">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-3 rounded-2xl font-semibold text-sm smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending your guide..." : "Get the Free PDF"}
            </button>

            {downloadUrl && (
              <div className="mt-4 text-center">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-purple-100 hover:bg-white/15 smooth-transition"
                >
                  <span>⬇️ Download Now</span>
                </a>
              </div>
            )}

            <p className="mt-4 text-[10px] text-purple-300/80 text-center">
              By joining, you agree to receive occasional emails from Cosmic Spirit Guide.
              You can unsubscribe anytime in a single click.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}



