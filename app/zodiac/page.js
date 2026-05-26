import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { zodiacSigns } from "@/lib/pseo/astrology";

export const dynamic = "force-static";

export const metadata = {
  title: "Zodiac Signs Guide | Aries to Pisces — Traits, Compatibility & More",
  description: "Complete guide to all 12 zodiac signs: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces. Personality traits, love compatibility, and free birth chart reading.",
  alternates: {
    canonical: "/zodiac",
  },
};

const elementColors = {
  Fire: { bg: "from-orange-500/20 to-red-600/20", border: "border-orange-500/30", accent: "text-orange-400" },
  Earth: { bg: "from-green-500/20 to-emerald-600/20", border: "border-green-500/30", accent: "text-green-400" },
  Air: { bg: "from-sky-500/20 to-blue-600/20", border: "border-sky-500/30", accent: "text-sky-400" },
  Water: { bg: "from-cyan-500/20 to-blue-600/20", border: "border-cyan-500/30", accent: "text-cyan-400" },
};

const elementEmoji = { Fire: "🔥", Earth: "🌍", Air: "💨", Water: "🌊" };

export default function ZodiacLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-cosmic-lavender">
              <Sparkles className="h-4 w-4 text-cosmic-gold" /> Astrology Guide
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
              Zodiac Signs
              <span className="block bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent">
                Complete Guide to All 12 Signs
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-cosmic-lavender/80 sm:text-xl">
              Every zodiac sign brings a unique blend of element, mode, gift, and shadow.
              Explore each sign&apos;s personality, love compatibility, and growth path.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {zodiacSigns.map((sign) => {
              const colors = elementColors[sign.element] || elementColors.Fire;
              return (
                <Link
                  key={sign.slug}
                  href={`/zodiac/${sign.slug}`}
                  className={`group rounded-3xl border ${colors.border} bg-gradient-to-br ${colors.bg} bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl`}
                >
                  <p className="mb-2 text-3xl">{elementEmoji[sign.element] || "⭐"}</p>
                  <h2 className="text-2xl font-bold text-white">{sign.name}</h2>
                  <p className={`mt-1 text-sm ${colors.accent}`}>
                    {sign.element} &bull; {sign.mode}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm capitalize text-cosmic-lavender/70">
                    {sign.gift}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-cosmic-gold opacity-0 transition group-hover:opacity-100">
                    Explore {sign.name} <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Link
              href="/compatibility"
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:border-cosmic-gold/30"
            >
              <h3 className="mb-2 text-xl font-bold text-white">Zodiac Compatibility</h3>
              <p className="text-cosmic-lavender/70">
                See how each sign pairs with every other sign. Strengths, challenges, and advice for all 78 pairings.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cosmic-gold">
                Explore pairings <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/birth-chart"
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:border-cosmic-gold/30"
            >
              <h3 className="mb-2 text-xl font-bold text-white">Free Birth Chart</h3>
              <p className="text-cosmic-lavender/70">
                Your Sun sign is just the beginning. Get your full birth chart with Moon, Rising, planets, and houses.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cosmic-gold">
                Calculate your chart <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
