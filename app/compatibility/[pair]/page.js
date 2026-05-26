import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Heart, Star, Compass, AlertTriangle, Zap } from "lucide-react";
import { getAllPairSlugs, getPairMeta, parsePairSlug } from "@/lib/compatibility-data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllPairSlugs().map((pair) => ({ pair }));
}

export function generateMetadata({ params }) {
  const pair = params.pair;
  const parsed = parsePairSlug(pair);
  if (!parsed) return {};
  const meta = getPairMeta(pair);
  if (!meta) return {};

  return {
    title: `${meta.sign1.name} and ${meta.sign2.name} Compatibility | Love Match Guide`,
    description: `${meta.sign1.name} (${meta.sign1.element}) and ${meta.sign2.name} (${meta.sign2.element}) compatibility: ${meta.level} match at ${meta.score}%. Strengths, challenges, and advice for this zodiac pairing.`,
    alternates: {
      canonical: `/compatibility/${pair}`,
    },
  };
}

const levelColors = {
  Excellent: { bg: "from-emerald-500/20 to-green-600/20", border: "border-emerald-500/30", accent: "text-emerald-400", glow: "shadow-emerald-500/10", ring: "ring-emerald-500/30" },
  Strong: { bg: "from-blue-500/20 to-cyan-600/20", border: "border-blue-500/30", accent: "text-blue-400", glow: "shadow-blue-500/10", ring: "ring-blue-500/30" },
  Good: { bg: "from-yellow-500/20 to-amber-600/20", border: "border-yellow-500/30", accent: "text-yellow-400", glow: "shadow-yellow-500/10", ring: "ring-yellow-500/30" },
  Challenging: { bg: "from-orange-500/20 to-red-600/20", border: "border-orange-500/30", accent: "text-orange-400", glow: "shadow-orange-500/10", ring: "ring-orange-500/30" },
};

function InsightCard({ icon: Icon, title, children, accent }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent || "bg-cosmic-gold/15 text-cosmic-gold"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-white">{title}</h2>
      <ul className="space-y-3">
        {children.map((item, i) => (
          <li key={i} className="flex items-start gap-3 leading-7 text-cosmic-lavender/80">
            <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${(accent || "bg-cosmic-gold/50")}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignBadge({ sign, label }) {
  const elementEmoji = { Fire: "🔥", Earth: "🌍", Air: "💨", Water: "🌊" };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
      <p className="mb-1 text-xs uppercase tracking-widest text-cosmic-lavender/40">{label}</p>
      <p className="text-3xl">{elementEmoji[sign.element] || "⭐"}</p>
      <p className="mt-1 text-xl font-bold text-white">{sign.name}</p>
      <p className="text-sm text-cosmic-lavender/60">{sign.element} &bull; {sign.mode}</p>
      <p className="mt-2 text-sm capitalize text-cosmic-gold">{sign.gift}</p>
    </div>
  );
}

export default function CompatibilityPairPage({ params }) {
  const pair = params.pair;
  const parsed = parsePairSlug(pair);
  if (!parsed) notFound();

  const meta = getPairMeta(pair);
  if (!meta) notFound();

  const { sign1, sign2, level, score, strengths, challenges, advice } = meta;
  const colors = levelColors[level] || levelColors.Good;

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <div className={`fixed inset-0 bg-gradient-to-br ${colors.bg} pointer-events-none`} />

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <Link href="/compatibility" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Compatibility Calculator
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-cosmic-lavender">
                <Sparkles className="h-4 w-4 text-cosmic-gold" /> Zodiac Compatibility
              </div>
              <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
                {sign1.name} & {sign2.name}
                <span className={`block bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent`}>
                  {level} Compatibility
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-cosmic-lavender/80 sm:text-xl">
                {sign1.name} ({sign1.element}) and {sign2.name} ({sign2.element}) create a <span className={`font-semibold ${colors.accent}`}>{level.toLowerCase()}</span> connection. Their dynamic blends {sign1.gift} with {sign2.gift} — here is how the pairing actually works.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/compatibility" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 text-center font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
                  Calculate Your Compatibility <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href={`/zodiac/${sign1.slug}`} className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-cosmic-lavender transition hover:bg-white/10">
                  About {sign1.name}
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-cosmic-violet/10 backdrop-blur">
              <div className={`rounded-3xl border ${colors.border} ${colors.bg} p-8 text-center`}>
                <p className={`text-6xl font-black ${colors.accent}`}>{score}%</p>
                <p className={`mt-2 text-lg font-semibold ${colors.accent}`}>{level}</p>
                <p className="mt-1 text-sm text-cosmic-lavender/60">Cosmic Compatibility Score</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <SignBadge sign={sign1} label="Sign 1" />
                <SignBadge sign={sign2} label="Sign 2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <InsightCard icon={Heart} title="Strengths" accent="bg-emerald-500/15 text-emerald-400">
            {strengths}
          </InsightCard>
          <InsightCard icon={AlertTriangle} title="Challenges" accent="bg-orange-500/15 text-orange-400">
            {challenges}
          </InsightCard>
          <InsightCard icon={Zap} title="Advice" accent="bg-cosmic-gold/15 text-cosmic-gold">
            {[advice]}
          </InsightCard>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-3xl font-black">Explore More Pairings</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {getAllPairSlugs().slice(0, 8).map((pairSlug) => {
              const p = parsePairSlug(pairSlug);
              if (!p) return null;
              return (
                <Link
                  key={pairSlug}
                  href={`/compatibility/${pairSlug}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cosmic-gold/30 hover:bg-white/[0.08]"
                >
                  <p className="font-bold text-white">{p.sign1.name} & {p.sign2.name}</p>
                  <p className="mt-1 text-sm text-cosmic-lavender/60">{p.sign1.element} &bull; {p.sign2.element}</p>
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <Link href="/compatibility" className="inline-flex items-center gap-2 text-cosmic-gold hover:text-amber-200">
              View all pairings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">Sun Signs Are Just the Surface</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Full synastry considers Moon, Venus, Mars, Rising signs, and house overlays. Get a personalized compatibility report based on your exact birth charts.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/compatibility" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
              Full Compatibility Report <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/birth-chart" className="rounded-2xl border border-white/15 px-7 py-4 font-bold text-cosmic-lavender transition hover:bg-white/10">
              Free Birth Chart
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
