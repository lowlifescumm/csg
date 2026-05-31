import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Star, Sun, Moon, BookOpen } from "lucide-react";
import { getSign, zodiacSigns } from "@/lib/pseo/astrology";

export const dynamic = "force-static";

export function generateStaticParams() {
  return zodiacSigns.map((sign) => ({ sign: sign.slug }));
}

export function generateMetadata({ params }) {
  const sign = getSign(params.sign);
  if (!sign) return {};

  return {
    title: `${sign.name} Zodiac Sign: Dates, Personality & Traits | Free Birth Chart`,
    description: `Discover everything about ${sign.name} zodiac sign: ${sign.element} ${sign.mode}, dates, personality traits, strengths (${sign.gift}), weaknesses (${sign.shadow}), and compatibility. Get your free birth chart reading.`,
    alternates: {
      canonical: `/zodiac/${sign.slug}`,
    },
  };
}

const elementGradients = {
  Fire: "from-orange-500 via-red-500 to-rose-600",
  Earth: "from-emerald-500 via-green-600 to-teal-700",
  Air: "from-sky-400 via-blue-500 to-indigo-600",
  Water: "from-cyan-400 via-blue-500 to-purple-600",
};

export default function ZodiacSignPage({ params }) {
  const sign = getSign(params.sign);
  if (!sign) notFound();

  const compat = getSignCompat(sign);
  const gradient = elementGradients[sign.element] || "from-cosmic-gold to-amber-500";

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className={`absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl`} />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/birth-chart" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Get Your Free Birth Chart
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-4 py-2 text-sm text-cosmic-lavender">
                <Sparkles className="h-4 w-4 text-cosmic-gold" /> Zodiac Sign Guide
              </div>
              <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
                {sign.name}
                <span className={`block bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {sign.element} {sign.mode} Sign
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-cosmic-lavender/80 sm:text-xl">
                {sign.name} is a {sign.element} {sign.mode.toLowerCase()} sign known for {sign.gift}. 
                People born under {sign.name} bring {sign.gift} to everything they do. 
                This page covers personality, strengths, weaknesses, love style, career paths, and compatibility so you can use this sign instead of just reading about it.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/birth-chart" className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 text-center font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
                  Get My Full Free Chart
                </Link>
                <Link href="/compatibility" className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-cosmic-lavender transition hover:bg-white/10">
                  Check Compatibility
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-cosmic-violet/10 backdrop-blur">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-cosmic-gold/10 p-5">
                  <Sun className="mb-3 h-8 w-8 text-cosmic-gold" />
                  <p className="text-sm uppercase tracking-[0.2em] text-cosmic-lavender/60">Element</p>
                  <p className="text-2xl font-bold">{sign.element}</p>
                </div>
                <div className="rounded-3xl bg-cosmic-violet/15 p-5">
                  <Moon className="mb-3 h-8 w-8 text-cosmic-lavender" />
                  <p className="text-sm uppercase tracking-[0.2em] text-cosmic-lavender/60">Mode</p>
                  <p className="text-2xl font-bold">{sign.mode}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-cosmic-lavender/50">Gift</p>
                  <p className="text-lg font-semibold text-white">{sign.gift}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-cosmic-lavender/50">Shadow</p>
                  <p className="text-lg font-semibold text-cosmic-rose/80">{sign.shadow}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-cosmic-lavender/50">Mantra</p>
                  <p className="text-lg font-semibold italic text-cosmic-gold">{sign.mantra}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <InsightCard icon={Star} title="Personality">
            As a {sign.element} {sign.mode.toLowerCase()} sign, {sign.name} brings {sign.gift} to every area of life. 
            The gift of {sign.gift} is your superpower — when you lead with it, doors open. 
            The shadow of {sign.shadow} is your edge to watch — awareness turns it from a liability into a teacher. 
            Your mantra: <span className="italic text-cosmic-gold">{sign.mantra}</span>
          </InsightCard>
          <InsightCard icon={Sun} title="Love & Compatibility">
            {sign.name} connects most naturally with signs that share the {sign.element} element or the 
            complementary element ({getComplementaryElement(sign.element)}). 
            {compat.best.length > 0 && ` Best matches: ${compat.best.join(", ")}.`}
            {compat.worst.length > 0 && ` Growth pairings: ${compat.worst.join(", ")}.`}
            In relationships, {sign.name} wants a partner who appreciates {sign.gift} without triggering {sign.shadow}.
          </InsightCard>
          <InsightCard icon={BookOpen} title="Career & Purpose">
            {sign.name} thrives in careers that channel {sign.gift}. 
            As a {sign.element} sign, you prefer environments that match your natural rhythm — 
            structured and patient for Earth, dynamic and bold for Fire, 
            collaborative and intellectual for Air, intuitive and creative for Water. 
            When your work aligns with your element, success follows naturally.
          </InsightCard>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-black sm:text-4xl">Explore All Zodiac Signs</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {zodiacSigns.map((s) => (
              <Link
                key={s.slug}
                href={`/zodiac/${s.slug}`}
                className={`rounded-2xl border p-4 text-center transition hover:scale-[1.02] ${s.slug === sign.slug ? "border-cosmic-gold/50 bg-cosmic-gold/10" : "border-white/10 bg-white/[0.04] hover:bg-white/10"}`}
              >
                <p className="font-bold text-white">{s.name}</p>
                <p className="text-xs text-cosmic-lavender/60">{s.element} • {s.mode}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">One sign is the surface. Twelve tell your whole story.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Your sun sign is just the beginning. Your moon sign, rising sign, houses, and planetary aspects reveal 
            the full picture. Use the free birth chart calculator to see how {sign.name} energy actually shows up in your life.
          </p>
          <Link href="/birth-chart" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
            Calculate My Full Chart <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function InsightCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cosmic-gold/15 text-cosmic-gold">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-white">{title}</h2>
      <p className="leading-7 text-cosmic-lavender/80">{children}</p>
    </div>
  );
}

function getComplementaryElement(element) {
  const map = { Fire: "Air", Air: "Fire", Earth: "Water", Water: "Earth" };
  return map[element] || element;
}

function getSignCompat(sign) {
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
  return compatMap[sign.slug] || { best: [], worst: [] };
}
