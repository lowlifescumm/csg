import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Compass, Sparkles, TrendingUp } from "lucide-react";
import { formatTransitDate, getNextTransitDates, isValidDateSlug, transitThemes } from "@/lib/pseo/astrology";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return getNextTransitDates(30).map((date) => ({ date }));
}

export function generateMetadata({ params }) {
  const formatted = formatTransitDate(params.date);
  if (!formatted) return {};

  return {
    title: `Daily Astrology Transit for ${formatted} | CosmicSpiritGuide`,
    description: `Read the daily astrology transit theme for ${formatted}. Get practical spiritual guidance, reflection prompts, and a free personalized chart reading.`,
    alternates: {
      canonical: `/transits/${params.date}`,
    },
  };
}

export default function DailyTransitLandingPage({ params }) {
  if (!isValidDateSlug(params.date)) notFound();
  const formatted = formatTransitDate(params.date);
  const theme = transitThemes[new Date(`${params.date}T00:00:00Z`).getUTCDate() % transitThemes.length];

  return (
    <main className="min-h-screen bg-cosmic-void text-white">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cosmic-rose/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cosmic-violet/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cosmic-gold/30 bg-cosmic-gold/10 px-4 py-2 text-sm font-semibold text-cosmic-gold">
            <CalendarDays className="h-4 w-4" /> Daily Transit Reading
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight sm:text-6xl">
            Daily Astrology Transit for {formatted}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-cosmic-lavender/80 sm:text-xl">
            Today emphasizes {theme}. Use this transit page as a quick spiritual weather report, then generate your personal chart to see how the day lands in your houses and placements.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/birth-chart" className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
              Get My Personalized Reading
            </Link>
            <Link href="/forecasts" className="rounded-2xl border border-white/15 px-7 py-4 font-bold text-cosmic-lavender transition hover:bg-white/10">
              View Forecasts
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            [Sparkles, "Energy", `The strongest move today is to simplify your focus around ${theme} and avoid chasing every signal at once.`],
            [Compass, "Reflection", "Ask where your current pattern is asking for maturity, honesty, or a cleaner boundary."],
            [TrendingUp, "Action", "Turn the insight into one small decision: send the message, protect the hour, or choose the next step."],
          ].map(([Icon, title, copy]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <Icon className="mb-4 h-8 w-8 text-cosmic-gold" />
              <h2 className="mb-3 text-2xl font-bold">{title}</h2>
              <p className="leading-7 text-cosmic-lavender/80">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur">
          <h2 className="mb-4 text-3xl font-black">Want the transit for your chart?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Generic transits get traffic. Personalized transits convert. Start with the free chart, then upgrade when you want deeper timing guidance.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
            See Premium Options <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
