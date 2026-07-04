import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, BookOpen, Sun, Moon } from "lucide-react";
import { findCardBySlug, getAllCardSlugs, MAJOR_ARCANA } from "@/lib/tarot-data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllCardSlugs().map((slug) => ({ "card-slug": slug }));
}

export function generateMetadata({ params }) {
  const card = findCardBySlug(params["card-slug"]);
  if (!card) return {};

  return {
    title: `${card.name} Tarot Card Meaning | Upright & Reversed Guide`,
    description: `${card.name} tarot card meaning: upright — ${card.upright}. Reversed — ${card.reversed}. Learn the full interpretation and get a free online tarot reading.`,
    alternates: {
      canonical: `/tarot/${card.slug}`,
    },
  };
}

const SUIT_META = {
  w: { name: "Wands", element: "Fire", icon: "🔥", meaning: "Creativity, action, inspiration" },
  c: { name: "Cups", element: "Water", icon: "🌊", meaning: "Emotions, relationships, intuition" },
  s: { name: "Swords", element: "Air", icon: "💨", meaning: "Thoughts, communication, truth" },
  p: { name: "Pentacles", element: "Earth", icon: "🌍", meaning: "Material world, career, abundance" },
};

function getCardMeta(card) {
  const isMajor = MAJOR_ARCANA.some((c) => c.id === card.id && typeof card.id === "number");
  if (isMajor) {
    return { type: "Major Arcana", subtitle: `${card.name} — Card ${card.id}` };
  }
  const suitKey = typeof card.id === "string" ? card.id[0] : null;
  const suit = suitKey ? SUIT_META[suitKey] : null;
  return {
    type: "Minor Arcana",
    subtitle: suit ? `${suit.name} (${suit.element})` : "",
    suit: suit || null,
  };
}

function cardToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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

export default function TarotCardPage({ params }) {
  const card = findCardBySlug(params["card-slug"]);
  if (!card) notFound();

  const meta = getCardMeta(card);
  const allCards = getAllCardSlugs().map((slug) => findCardBySlug(slug)).filter(Boolean);
  const relatedCards = allCards
    .filter((c) => c.slug !== card.slug)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <Link href="/tarot" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Tarot
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-cosmic-lavender">
                <Sparkles className="h-4 w-4 text-cosmic-gold" /> {meta.type}
              </div>
              <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
                {card.name}
              </h1>
              {meta.subtitle && (
                <p className="mb-4 text-lg text-cosmic-lavender/60">{meta.subtitle}</p>
              )}
              {meta.suit && (
                <p className="mb-6 text-cosmic-lavender/80">{meta.suit.icon} {meta.suit.meaning}</p>
              )}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/tarot" className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 px-7 py-4 text-center font-bold text-cosmic-void shadow-lg shadow-cosmic-gold/20 transition hover:scale-[1.02]">
                  Get a Free Tarot Reading
                </Link>
                <Link href="/birth-chart" className="rounded-2xl border border-white/15 px-7 py-4 text-center font-bold text-cosmic-lavender transition hover:bg-white/10">
                  Free Birth Chart
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-cosmic-violet/10 backdrop-blur">
              <div className="flex flex-col items-center">
                <img
                  src={card.image}
                  alt={card.name}
                  className="h-64 w-auto rounded-2xl shadow-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-cosmic-gold/20 bg-cosmic-gold/10 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cosmic-gold/15 text-cosmic-gold">
              <Sun className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Upright Meaning</h2>
            <span className="mb-3 inline-block rounded-full bg-cosmic-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cosmic-gold">Upright</span>
            <p className="leading-7 text-cosmic-lavender/80">{card.upright}</p>
          </div>

          <div className="rounded-3xl border border-cosmic-violet/20 bg-cosmic-violet/10 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cosmic-violet/15 text-cosmic-lavender">
              <Moon className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Reversed Meaning</h2>
            <span className="mb-3 inline-block rounded-full bg-cosmic-violet/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cosmic-lavender">Reversed</span>
            <p className="leading-7 text-cosmic-lavender/80">{card.reversed}</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <Card icon={BookOpen} title="In a Reading">
            When {card.name} appears upright in a spread, it signals {card.upright.toLowerCase()}. This card encourages you to lean into its energy and trust where it leads.
          </Card>
          <Card icon={Sun} title="Growth Edge">
            The reversed {card.name} asks you to examine where {card.reversed.toLowerCase()} might be showing up. Growth comes from facing this energy honestly rather than avoiding it.
          </Card>
          <Card icon={Sparkles} title="Journal Prompt">
            Where in my life right now does the energy of {card.name} feel most present? What would change if I fully trusted this card&apos;s message?
          </Card>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">One Card. A Full Reading. Your Choice.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            Pick from 11 different tarot spreads — daily guidance, love, career, past-present-future, and more. Every reading is instant and free.
          </p>
          <Link href="/tarot" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
            Start Your Free Reading <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {relatedCards.length > 0 && (
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-3xl font-black">Explore More Cards</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCards.map((c) => (
                <Link
                  key={c.slug}
                  href={`/tarot/${c.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cosmic-gold/30 hover:bg-white/[0.08]"
                >
                  <img src={c.image} alt={c.name} className="h-16 w-auto rounded-lg" loading="lazy" />
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="line-clamp-1 text-sm text-cosmic-lavender/60">{c.upright}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/tarot" className="inline-flex items-center gap-2 text-cosmic-gold hover:text-amber-200">
                View all 78 cards <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
