"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

export default function ReadingLandingPage() {
  const router = useRouter();

  const handleCTAClick = () => {
    router.push("/login?redirect=/dashboard");
  };

  // Brand color constant
  const BRAND_COLOR = "#8B5CF6";

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden">
      <div className="relative z-10">
        {/* SECTION 1: HERO */}
        <section className="pt-24 pb-20 md:pt-36 md:pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-gray-900 tracking-tight leading-[1.1] mb-8">
              See the patterns influencing your decisions, relationships, and <span style={{ color: BRAND_COLOR }}>timing.</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Personalized insights using symbolic systems and intuitive pattern mapping — designed for reflection, not blind belief.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleCTAClick}
                style={{ backgroundColor: BRAND_COLOR }}
                className="group relative px-10 py-5 text-white rounded-2xl font-medium text-xl shadow-lg shadow-purple-100 hover:brightness-110 transition-all duration-300"
              >
                Start a Personal Reading
              </button>
              <p className="text-gray-500 text-sm font-medium">
                No hype. No pressure. Just insight.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHO THIS IS FOR */}
        <section className="py-20 md:py-24 px-6" style={{ backgroundColor: `${BRAND_COLOR}08` }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center text-gray-900">
              This is for you if…
            </h2>
            <ul className="space-y-6 mb-16">
              {[
                "You keep noticing the same situations repeating in different forms",
                "You feel stuck choosing between logic and intuition",
                "Advice hasn’t helped because timing always feels off",
                "You want perspective, not someone telling you what to do"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${BRAND_COLOR}15` }}>
                    <Check className="w-3.5 h-3.5" style={{ color: BRAND_COLOR }} />
                  </div>
                  <span className="text-lg md:text-xl text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="w-24 h-px bg-gray-200 mx-auto mb-12" />

            <p className="text-center text-gray-400 text-sm max-w-sm mx-auto italic">
              "This is not for people looking for guarantees, lottery numbers, or someone to make decisions for them."
            </p>
          </div>
        </section>

        {/* SECTION 3: WHAT A READING ACTUALLY IS */}
        <section className="py-20 md:py-32 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-gray-900">
              What a Cosmic Spirit Guide reading actually does
            </h2>
            <div className="space-y-8 text-xl text-gray-600 leading-relaxed">
              <p>
                A reading is a structured reflection using symbolic systems like astrology and tarot to surface patterns that are usually unconscious.
              </p>
              <p>
                Symbols work because the human mind understands metaphor faster than instruction. They bypass defensiveness and create clarity.
              </p>
              <p className="text-gray-900 font-medium">
                You don’t need belief. You only need curiosity.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOW IT WORKS */}
        <section className="py-20 md:py-32 px-6" style={{ backgroundColor: `${BRAND_COLOR}05` }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-16 text-center text-gray-900">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-16">
              {[
                {
                  step: "01",
                  desc: "You choose a reading type based on what you want clarity around."
                },
                {
                  step: "02",
                  desc: "You provide minimal personal context so the reading stays focused."
                },
                {
                  step: "03",
                  desc: "You receive a written or audio interpretation designed to highlight patterns, timing, and blind spots."
                }
              ].map((item, idx) => (
                <div key={idx} className="relative p-8 rounded-3xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-sm font-bold block mb-4 uppercase tracking-widest" style={{ color: BRAND_COLOR }}>{item.step}</span>
                  <p className="text-gray-800 text-lg leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 font-medium">
              No cold readings. No vague statements. Every session is intentional.
            </p>
          </div>
        </section>

        {/* SECTION 5: READING TYPES */}
        <section className="py-20 md:py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-16 text-center text-gray-900">
              Reading options
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Pattern & Direction Reading",
                  desc: "For life themes, repeated cycles, and decision clarity."
                },
                {
                  title: "Relationship Pattern Reading",
                  desc: "For attraction dynamics, emotional loops, and boundaries."
                },
                {
                  title: "Timing & Transition Reading",
                  desc: "For moments of change, hesitation, or pressure."
                }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-3xl border border-gray-100 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-normal italic">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: WHY THIS IS DIFFERENT */}
        <section className="py-20 md:py-32 px-6 mx-4 md:mx-8 rounded-[3rem]" style={{ backgroundColor: `${BRAND_COLOR}10` }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-16 text-center text-gray-900">
              Why this approach works
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-16">
              {[
                "Focuses on patterns, not predictions",
                "Encourages agency, not dependency",
                "Uses symbolism as a reflection tool, not a rulebook",
                "Designed to leave you clearer, not confused"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLOR }} />
                  <span className="text-lg md:text-xl text-gray-700 font-light">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-xl font-light italic">
              "Most people don’t need answers. They need perspective."
            </p>
          </div>
        </section>

        {/* SECTION 7: PROCESS-BASED SOCIAL PROOF */}
        <section className="py-24 md:py-40 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl md:text-3xl text-gray-500 leading-relaxed font-light">
              "People turn to symbolic systems not because they are lost, but because logic alone doesn’t explain timing, emotion, or intuition."
            </p>
          </div>
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="py-20 md:py-32 px-6 border-t border-gray-100">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-semibold mb-12 text-gray-900 tracking-tight">
              Clarity starts with seeing the <span style={{ color: BRAND_COLOR }}>pattern.</span>
            </h2>
            <button
              onClick={handleCTAClick}
              style={{ backgroundColor: BRAND_COLOR }}
              className="w-full sm:w-auto px-12 py-5 text-white rounded-2xl font-medium text-xl shadow-lg shadow-purple-100 hover:brightness-110 transition-all duration-300 mb-6"
            >
              Begin Your Reading
            </button>
            <p className="text-gray-400 text-sm">
              You’re always in control of what you take from it.
            </p>
          </div>
        </section>

        {/* SECTION 9: FOOTER TRUST ELEMENTS */}
        <footer className="py-12 px-6 border-t border-gray-100">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="font-semibold text-gray-900 tracking-tight">Cosmic Spirit Guide</span>
              <p className="text-xs text-gray-400 max-w-xs text-center md:text-left">
                Readings are for reflection and insight purposes only. Not a substitute for professional advice.
              </p>
            </div>
            <nav className="flex items-center gap-8 text-sm font-medium text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
              <span className="cursor-help underline decoration-gray-200 underline-offset-4">Disclaimer</span>
            </nav>
          </div>
          <div className="mt-8 text-center text-[10px] text-gray-300 uppercase tracking-widest">
            © {new Date().getFullYear()} Cosmic Spirit Guide
          </div>
        </footer>
      </div>
    </div>
  );
}

// Minimal CSS for animations if needed, though Tailwind covers most
// .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
// .animate-slide-up { animation: slideUp 0.8s ease-out forwards; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
