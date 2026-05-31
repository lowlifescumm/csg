import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Heart, Sun, Moon, Star } from "lucide-react";
import { getSign, zodiacSigns } from "@/lib/pseo/astrology";

export const dynamic = "force-static";

export function generateStaticParams() {
  const pairs = [];
  for (let i = 0; i < zodiacSigns.length; i++) {
    for (let j = i + 1; j < zodiacSigns.length; j++) {
      pairs.push({ sign1: zodiacSigns[i].slug, sign2: zodiacSigns[j].slug });
    }
  }
  return pairs;
}

const compatMap = {
  aries: { best: ["Leo", "Sagittarius", "Gemini", "Aquarius"], worst: ["Cancer", "Capricorn"] },
  taurus: { best: ["Virgo", "Capricorn", "Cancer", "Pisces"], worst: ["Leo", "Aquarius"] },
  gemini: { best: ["Libra", "Aquarius", "Aries", "Leo"], worst: ["Virgo", "Pisces"] },
  cancer: { best: ["Scorpio", "Pisces", "Taurus", "Virgo"], worst: ["Aries", "Libra"] },
  leo: { best: ["Aries", "Sagittarius", "Gemini", "Libra"], worst: ["Taurus", "Scorpio"] },
  virgo: { best: ["Taurus", "Capricorn", "Cancer", "Scorpio"], worst: ["Gemini", "Sagittarius"] },
  libra: { best: ["Gemini", "Aquarius", "Leo", "Sagittarius"], worst: ["Cancer", "Capricorn"] },
  scorpio: { best: ["Cancer", "Pisces", "Virgo", "Capricorn"], worst: ["Leo", "Aquarius"] },
  sagittarius: { best: ["Aries", "Leo", "Libra", "Aquarius"], worst: ["Virgo", "Pisces"] },
  capricorn: { best: ["Taurus", "Virgo", "Scorpio", "Pisces"], worst: ["Aries", "Libra"] },
  aquarius: { best: ["Gemini", "Libra", "Aries", "Sagittarius"], worst: ["Taurus", "Scorpio"] },
  pisces: { best: ["Cancer", "Scorpio", "Taurus", "Capricorn"], worst: ["Gemini", "Sagittarius"] },
};

export function generateMetadata({ params }) {
  const sign1 = getSign(params.sign1);
  const sign2 = getSign(params.sign2);
  if (!sign1 || !sign2) return {};

  const compat = getPairCompat(sign1, sign2);

  return {
    title: `${sign1.name} and ${sign2.name} Zodiac Compatibility | Love Match Guide`,
    description: `${sign1.name} and ${sign2.name} zodiac compatibility: ${compat.label} match (${compat.score}/100). Learn how ${sign1.name} ${sign1.element} and ${sign2.name} ${sign2.element} connect in love, friendship, communication, and long-term potential.`,
    alternates: {
      canonical: `/compatibility/${sign1.slug}-and-${sign2.slug}`,
    },
  };
}

function getPairCompat(sign1, sign2) {
  const s1 = compatMap[sign1.slug];
  if (!s1) return { score: 65, label: "Moderate" };
  if (s1.best.includes(sign2.name)) return { score: 85, label: "Excellent" };
  if (s1.worst.includes(sign2.name)) return { score: 45, label: "Challenging" };
  return { score: 65, label: "Good" };
}

function getPairTone(sign1, sign2) {
  if (sign1.element === sign2.element) {
    return `Both ${sign1.name} and ${sign2.name} are ${sign1.element} signs, creating natural harmony and shared rhythm. You instinctively understand each other's pace and priorities. The challenge: avoiding complacency and keeping the dynamic fresh.`;
  }
  const fireWater = (sign1.element === "Fire" && sign2.element === "Water") || (sign1.element === "Water" && sign2.element === "Fire");
  const earthAir = (sign1.element === "Earth" && sign2.element === "Air") || (sign1.element === "Air" && sign2.element === "Earth");
  if (fireWater) {
    return `${sign1.name} (${sign1.element}) and ${sign2.name} (${sign2.element}) bring opposing energies that can create either intense chemistry or friction. Water can feel overwhelmed by Fire's intensity; Fire can feel dampened by Water's depth. With awareness, this pairing teaches profound mutual growth.`;
  }
  if (earthAir) {
    return `${sign1.name} (${sign1.element}) and ${sign2.name} (${sign2.element}) operate at different speeds. Earth builds patiently while Air explores possibilities. The growth edge: Earth learning to dream bigger, Air learning to follow through.`;
  }
  const compatibleElements = {
    Fire: "Air", Air: "Fire",
    Earth: "Water", Water: "Earth",
  };
  if (compatibleElements[sign1.element] === sign2.element || compatibleElements[sign2.element] === sign1.element) {
    return `${sign1.name} (${sign1.element}) and ${sign2.name} (${sign2.element}) naturally complement each other. ${sign1.element} brings what ${sign2.element} needs and vice versa. This pairing has strong foundations with room for growth in understanding each other's core motivations.`;
  }
  return `${sign1.name} (${sign1.element}) and ${sign2.name} (${sign2.element}) bring different energies to the connection. The strength of this pair lies in what each teaches the other.`;
}

function getPairStrengths(sign1, sign2) {
  const strengths = [];
  if (sign1.element === sign2.element) {
    strengths.push(`Shared ${sign1.element} element — you communicate on the same wavelength without effort`);
  } else {
    strengths.push(`Complementary elements — ${sign1.element} and ${sign2.element} balance each other naturally`);
  }
  if (sign1.mode === sign2.mode) {
    strengths.push(`Same ${sign1.mode} mode — you approach life with similar energy and drive`);
  } else {
    strengths.push(`Different modes — ${sign1.mode} ${sign1.name} and ${sign2.mode} ${sign2.name} keep each other adaptable`);
  }
  strengths.push(`${sign1.gift} (${sign1.name}) + ${sign2.gift} (${sign2.name}) — your combined strengths cover a wide range of life situations`);
  return strengths;
}

export default function CompatibilityPairPage({ params }) {
  const sign1 = getSign(params.sign1);
  const sign2 = getSign(params.sign2);
  if (!sign1 || !sign2) notFound();

  const compat = getPairCompat(sign1, sign2);
  const tone = getPairTone(sign1, sign2);
  const strengths = getPairStrengths(sign1, sign2);

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cosmic-violet/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/compatibility" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Free Compatibility Calculator
          </Link>

          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-4 py-2 text-sm text-cosmic-lavender">
              <Sparkles className="h-4 w-4 text-cosmic-gold" /> Zodiac Compatibility Guide
            </div>
            <h1 className="mb-4 text-4xl font-black sm:text-5xl lg:text-7xl">
              {sign1.name} & {sign2.name}
              <span className="block bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent">
                Zodiac Compatibility
              </span>
            </h1>

            <div className="mx-auto mb-10 inline-flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] px-8 py-6">
              <span className="text-6xl font-black">{compat.score}</span>
              <div className="text-left">
                <p className="text-lg font-semibold text-white">{compat.label} Match</p>
                <p className="text-sm text-cosmic-lavender/60">{sign1.element} + {sign2.element}</p>
              </div>
            </div>

            <p className="mx-auto max-w-3xl text-lg leading-8 text-cosmic-lavender/80">
              {tone}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/compatibility" className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 text-center font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
                Calculate Your Compatibility
              </Link>
              <Link href="/birth-chart" className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-cosmic-lavender transition hover:bg-white/10">
                Get Full Synastry Report
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-black sm:text-4xl">Strengths of This Pairing</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {strengths.map((strength, i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cosmic-gold/15 text-cosmic-gold">
                  <Star className="h-5 w-5" />
                </div>
                <p className="leading-7 text-cosmic-lavender/80">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cosmic-gold/15 text-cosmic-gold">
              <Sun className="h-5 w-5" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">{sign1.name}</h2>
            <ul className="space-y-2 text-cosmic-lavender/80">
              <li><strong>Element:</strong> {sign1.element}</li>
              <li><strong>Mode:</strong> {sign1.mode}</li>
              <li><strong>Gift:</strong> {sign1.gift}</li>
              <li><strong>Shadow:</strong> {sign1.shadow}</li>
              <li><strong>Mantra:</strong> <span className="italic text-cosmic-gold">{sign1.mantra}</span></li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cosmic-violet/15 text-cosmic-lavender">
              <Moon className="h-5 w-5" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">{sign2.name}</h2>
            <ul className="space-y-2 text-cosmic-lavender/80">
              <li><strong>Element:</strong> {sign2.element}</li>
              <li><strong>Mode:</strong> {sign2.mode}</li>
              <li><strong>Gift:</strong> {sign2.gift}</li>
              <li><strong>Shadow:</strong> {sign2.shadow}</li>
              <li><strong>Mantra:</strong> <span className="italic text-cosmic-gold">{sign2.mantra}</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-black sm:text-4xl">Explore All Compatibility Pairs</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {zodiacSigns.map((s1) =>
              zodiacSigns.map((s2) => {
                if (s1.slug === s2.slug) return null;
                const key = [s1.slug, s2.slug].sort().join("-");
                if (key !== `${s1.slug}-${s2.slug}`) return null;
                const isActive = s1.slug === sign1.slug && s2.slug === sign2.slug;
                return (
                  <Link
                    key={`${s1.slug}-and-${s2.slug}`}
                    href={`/compatibility/${s1.slug}-and-${s2.slug}`}
                    className={`rounded-xl border p-3 text-center text-sm transition hover:scale-[1.02] ${isActive ? "border-cosmic-gold/50 bg-cosmic-gold/10" : "border-white/10 bg-white/[0.04] hover:bg-white/10"}`}
                  >
                    <p className="font-semibold text-white">{s1.name} & {s2.name}</p>
                    <p className="text-xs text-cosmic-lavender/60">{s1.element} + {s2.element}</p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">Sun sign compatibility is just the beginning.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Your full synastry report reveals how Moon signs, Venus placements, Mars energy, and house overlays 
            shape your real connection. Use the free compatibility calculator to go beyond sun signs.
          </p>
          <Link href="/compatibility" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
            Calculate Full Compatibility <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
