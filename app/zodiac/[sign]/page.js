import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Star, Heart, Compass, Moon, Sun } from "lucide-react";
import { getSign, zodiacSigns } from "@/lib/pseo/astrology";

export const dynamic = "force-static";

export function generateStaticParams() {
  return zodiacSigns.map((sign) => ({ sign: sign.slug }));
}

export function generateMetadata({ params }) {
  const sign = getSign(params.sign);
  if (!sign) return {};

  return {
    title: `${sign.name} Zodiac Sign | Traits, Personality & Compatibility Guide`,
    description: `Complete guide to ${sign.name} (${sign.element} ${sign.mode}): ${sign.gift}, ${sign.shadow}, love compatibility, and free birth chart reading.`,
    alternates: {
      canonical: `/zodiac/${sign.slug}`,
    },
  };
}

const elementColors = {
  Fire: { bg: "from-orange-500/20 to-red-600/20", border: "border-orange-500/30", accent: "text-orange-400", glow: "shadow-orange-500/10" },
  Earth: { bg: "from-green-500/20 to-emerald-600/20", border: "border-green-500/30", accent: "text-green-400", glow: "shadow-green-500/10" },
  Air: { bg: "from-sky-500/20 to-blue-600/20", border: "border-sky-500/30", accent: "text-sky-400", glow: "shadow-sky-500/10" },
  Water: { bg: "from-cyan-500/20 to-blue-600/20", border: "border-cyan-500/30", accent: "text-cyan-400", glow: "shadow-cyan-500/10" },
};

function Card({ icon: Icon, title, children }) {
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

export default function ZodiacSignPage({ params }) {
  const sign = getSign(params.sign);
  if (!sign) notFound();

  const colors = elementColors[sign.element] || elementColors.Fire;
  const sameElement = zodiacSigns.filter((s) => s.element === sign.element && s.slug !== sign.slug);
  const compatibleSigns = zodiacSigns.filter((s) => {
    const elementPairs = { Fire: ["Air"], Earth: ["Water"], Air: ["Fire", "Water"], Water: ["Earth", "Air"] };
    return elementPairs[sign.element]?.includes(s.element) && s.slug !== sign.slug;
  });

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <div className={`fixed inset-0 bg-gradient-to-br ${colors.bg} pointer-events-none`} />

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <Link href="/birth-chart" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Free Birth Chart Calculator
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-cosmic-lavender">
                <Sparkles className="h-4 w-4 text-cosmic-gold" /> Zodiac Sign Guide
              </div>
              <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
                {sign.name}
                <span className="block bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent">
                  {sign.element} {sign.mode}
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-cosmic-lavender/80 sm:text-xl">
                {sign.name} is a {sign.element} sign driven by {sign.gift}. When balanced, this energy creates unstoppable momentum. The shadow to watch: {sign.shadow}.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/birth-chart" className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 text-center font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
                  Get My Free Birth Chart
                </Link>
                <Link href={`/horoscope/${sign.slug}`} className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-cosmic-lavender transition hover:bg-white/10">
                  Today&apos;s {sign.name} Horoscope
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-cosmic-violet/10 backdrop-blur">
              <div className={`rounded-3xl ${colors.bg} border ${colors.border} p-6 text-center`}>
                <p className={`text-5xl mb-3 ${colors.accent}`}>
                  {sign.element === "Fire" && "🔥"}
                  {sign.element === "Earth" && "🌍"}
                  {sign.element === "Air" && "💨"}
                  {sign.element === "Water" && "🌊"}
                </p>
                <h3 className="text-3xl font-bold">{sign.name}</h3>
                <p className={`mt-2 ${colors.accent}`}>{sign.element} &bull; {sign.mode}</p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-cosmic-gold/20 bg-cosmic-gold/10 p-4">
                  <Sun className="h-5 w-5 text-cosmic-gold" />
                  <div>
                    <p className="text-sm text-cosmic-lavender/60">Gift</p>
                    <p className="font-semibold capitalize">{sign.gift}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Moon className="h-5 w-5 text-cosmic-lavender" />
                  <div>
                    <p className="text-sm text-cosmic-lavender/60">Shadow</p>
                    <p className="font-semibold capitalize">{sign.shadow}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-cosmic-violet/20 bg-cosmic-violet/10 p-4">
                  <p className="text-sm text-cosmic-lavender/60 mb-1">Daily Mantra</p>
                  <p className="font-semibold italic text-cosmic-gold">&ldquo;{sign.mantra}&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <Card icon={Star} title="Personality">
            {sign.name} brings {sign.gift} to everything they do. As a {sign.mode} {sign.element} sign, the driving force is authentic self-expression. The people closest to {sign.name} value their directness, loyalty, and natural leadership.
          </Card>
          <Card icon={Heart} title="Love & Relationships">
            In relationships, {sign.name} needs a partner who understands their {sign.element} nature. The gift of {sign.gift} makes them passionate and devoted. The shadow of {sign.shadow} means they thrive with someone who gives them space to grow while offering steady support.
          </Card>
          <Card icon={Compass} title="Growth Path">
            Your mantra: {sign.mantra} The path forward is learning when to lead with your natural {sign.element} energy and when to pause. The most powerful version of {sign.name} is the one who knows their gift without being ruled by their shadow.
          </Card>
        </div>
      </section>

      {sameElement.length > 0 && (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-3xl font-black">Same Element: {sign.element} Signs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sameElement.map((s) => (
                <Link key={s.slug} href={`/zodiac/${s.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cosmic-gold/30 hover:bg-white/[0.08]">
                  <p className="text-lg font-bold">{s.name}</p>
                  <p className="text-sm text-cosmic-lavender/60">{s.element} &bull; {s.mode}</p>
                  <p className="mt-2 text-sm text-cosmic-lavender/80 capitalize">{s.gift}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {compatibleSigns.length > 0 && (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-3 text-3xl font-black">Compatible Signs</h2>
            <p className="mb-8 text-cosmic-lavender/60">Signs whose element creates natural harmony with {sign.name}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {compatibleSigns.map((s) => (
                <Link key={s.slug} href={`/zodiac/${s.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cosmic-gold/30 hover:bg-white/[0.08]">
                  <p className="text-lg font-bold">{s.name}</p>
                  <p className="text-sm text-cosmic-lavender/60">{s.element} &bull; {s.mode}</p>
                  <p className="mt-2 text-sm text-cosmic-lavender/80 capitalize">{s.gift}</p>
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <Link href={`/compatibility`} className="inline-flex items-center gap-2 text-cosmic-gold hover:text-amber-200">
                Explore all compatibility pairs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">Your Sun Sign Is Just the Beginning</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Your full birth chart reveals how your {sign.name} Sun interacts with your Moon, Rising, planets, and houses. Get a free personalized reading.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/birth-chart" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
              Calculate My Full Chart <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/tarot" className="rounded-2xl border border-white/15 px-7 py-4 font-bold text-cosmic-lavender transition hover:bg-white/10">
              Free Tarot Reading
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
