import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Moon, Sparkles, Star, Sun } from "lucide-react";
import { getCombinationTone, getSign, zodiacSigns } from "@/lib/pseo/astrology";

export const dynamic = "force-static";

export function generateStaticParams() {
  return zodiacSigns.flatMap((sun) =>
    zodiacSigns.map((moon) => ({ sunSign: sun.slug, moonSign: moon.slug }))
  );
}

export function generateMetadata({ params }) {
  const sun = getSign(params.sunSign);
  const moon = getSign(params.moonSign);
  if (!sun || !moon) return {};

  return {
    title: `${sun.name} Sun ${moon.name} Moon Meaning | Free Birth Chart Guide`,
    description: `Learn what ${sun.name} Sun with ${moon.name} Moon means for personality, emotions, love, purpose, and your next step. Get a free birth chart reading.`,
    alternates: {
      canonical: `/astrology/${sun.slug}/${moon.slug}`,
    },
  };
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

export default function SunMoonLandingPage({ params }) {
  const sun = getSign(params.sunSign);
  const moon = getSign(params.moonSign);
  if (!sun || !moon) notFound();

  const title = `${sun.name} Sun ${moon.name} Moon`;
  const tone = getCombinationTone(sun, moon);

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cosmic-violet/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/birth-chart" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Free Birth Chart Calculator
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-4 py-2 text-sm text-cosmic-lavender">
                <Sparkles className="h-4 w-4 text-cosmic-gold" /> Sun and Moon Sign Meaning
              </div>
              <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
                {title}
                <span className="block bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent">
                  Meaning & Personality
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-cosmic-lavender/80 sm:text-xl">
                {title} combines {sun.gift} with {moon.gift}. This page gives you the fast interpretation, emotional pattern, love style, and growth move so you can use the placement instead of just reading about it.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/birth-chart" className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 text-center font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
                  Get My Full Free Chart
                </Link>
                <Link href="/pricing" className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-cosmic-lavender transition hover:bg-white/10">
                  Unlock Premium Readings
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-cosmic-violet/10 backdrop-blur">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-cosmic-gold/10 p-5">
                  <Sun className="mb-3 h-8 w-8 text-cosmic-gold" />
                  <p className="text-sm uppercase tracking-[0.2em] text-cosmic-lavender/60">Sun</p>
                  <p className="text-2xl font-bold">{sun.name}</p>
                  <p className="mt-2 text-sm text-cosmic-lavender/70">{sun.element} • {sun.mode}</p>
                </div>
                <div className="rounded-3xl bg-cosmic-violet/15 p-5">
                  <Moon className="mb-3 h-8 w-8 text-cosmic-lavender" />
                  <p className="text-sm uppercase tracking-[0.2em] text-cosmic-lavender/60">Moon</p>
                  <p className="text-2xl font-bold">{moon.name}</p>
                  <p className="mt-2 text-sm text-cosmic-lavender/70">{moon.element} • {moon.mode}</p>
                </div>
              </div>
              <p className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 leading-7 text-cosmic-lavender/80">{tone}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <InsightCard icon={Sun} title="Core Drive">
            Your {sun.name} Sun wants to express {sun.gift}. When life feels flat, you need a goal that lets this part of you lead without apologizing.
          </InsightCard>
          <InsightCard icon={Moon} title="Emotional Needs">
            Your {moon.name} Moon regulates through {moon.gift}. Stress usually rises when the shadow pattern of {moon.shadow} takes over.
          </InsightCard>
          <InsightCard icon={Star} title="Growth Move">
            Practice this mantra: {sun.mantra} Then balance it with the Moon reminder: {moon.mantra}
          </InsightCard>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">Two placements tell a story. Twelve tell your life.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Your rising sign, houses, planets, aspects, and current transits reveal where the pattern is actually playing out. Use the free calculator to turn this snapshot into a reading that speaks directly to you.
          </p>
          <Link href="/birth-chart" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
            Calculate My Full Chart <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
