import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, Moon, Star, BookOpen } from "lucide-react";
import { getCardBySlug, cardSlug, MAJOR_ARCANA, MINOR_ARCANA, ALL_CARDS } from "@/lib/tarot-data";

export const dynamic = "force-static";

const SUIT_LABELS = {
  wands: "Wands — Action & Passion",
  cups: "Cups — Emotion & Intuition",
  swords: "Swords — Intellect & Conflict",
  pentacles: "Pentacles — Material & Work",
};

export function generateStaticParams() {
  return ALL_CARDS.map((card) => ({ "card-slug": cardSlug(card.name) }));
}

export function generateMetadata({ params }) {
  const card = getCardBySlug(params["card-slug"]);
  if (!card) return {};

  return {
    title: `${card.name} Tarot Card Meaning: Upright & Reversed Guide`,
    description: `Learn the meaning of ${card.name} tarot card. Discover upright keywords (${card.upright}) and reversed meaning (${card.reversed}). Free tarot reading and card meanings guide.`,
    alternates: {
      canonical: `/tarot/${cardSlug(card.name)}`,
    },
  };
}

function getSuit(slug) {
  const card = getCardBySlug(slug);
  if (!card) return null;
  if (MAJOR_ARCANA.some(c => c.id === card.id)) return { name: "Major Arcana", label: "Major Arcana — Life Themes & Spiritual Lessons" };
  for (const [suit, cards] of Object.entries(MINOR_ARCANA)) {
    if (cards.some(c => c.id === card.id)) return { name: suit, label: SUIT_LABELS[suit] || suit };
  }
  return null;
}

export default function TarotCardPage({ params }) {
  const card = getCardBySlug(params["card-slug"]);
  if (!card) notFound();

  const suit = getSuit(params["card-slug"]);
  const isMajor = suit?.name === "Major Arcana";

  return (
    <main className="min-h-screen overflow-hidden bg-cosmic-void text-white">
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cosmic-violet/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/tarot" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cosmic-gold hover:text-amber-200">
            <ArrowRight className="h-4 w-4 rotate-180" /> Free Tarot Reading
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-4 py-2 text-sm text-cosmic-lavender">
                <Sparkles className="h-4 w-4 text-cosmic-gold" /> Tarot Card Meaning
              </div>
              <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {card.name}
                <span className="block bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent">
                  Tarot Card Meaning
                </span>
              </h1>
              {suit && (
                <p className="mb-6 inline-block rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-4 py-1 text-sm text-cosmic-lavender">
                  {suit.label}
                </p>
              )}
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-8 text-cosmic-lavender/80">
                  {card.name} is{isMajor ? " one of the 22 Major Arcana cards" : ` part of the ${suit?.name || "Minor Arcana"} suit`} 
                  {" "}in the tarot deck. This card carries powerful symbolism and guidance 
                  whether it appears upright or reversed in a reading.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {card.image && (
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-4">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="mx-auto h-auto w-full max-w-xs rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <MeaningCard variant="upright" title={`${card.name} Upright Meaning`}>
            When {card.name} appears upright in a reading, it signals: <strong className="text-white">{card.upright}</strong>.
            <br /><br />
            This is the card's core energy flowing freely. The upright position represents the conscious, 
            direct expression of the card's archetype. In a spread, it suggests you are aligned with the 
            natural energy of this card — or being called to embody its qualities.
            {!isMajor && <><br /><br />As a Minor Arcana card, {card.name} speaks to day-to-day situations rather than life-defining themes. 
            Its appearance points to practical, actionable guidance in the {suit?.name || "relevant"} area of life.</>}
          </MeaningCard>
          <MeaningCard variant="reversed" title={`${card.name} Reversed Meaning`}>
            When {card.name} appears reversed, it signals: <strong className="text-cosmic-rose">{card.reversed}</strong>.
            <br /><br />
            A reversed card often indicates blocked energy, internalized expression, or a need to look inward. 
            Rather than meaning the opposite of the upright meaning, reversal typically points to:
            <br /><br />
            — The energy is present but directed inward<br />
            — You are being asked to go deeper before acting<br />
            — The shadow aspect needs attention before the gift can flow<br /><br />
            Reversals are invitations, not warnings. {card.name} reversed asks you to work with this energy 
            from a place of awareness rather than reaction.
          </MeaningCard>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-black sm:text-4xl">Explore More Tarot Cards</h2>
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {ALL_CARDS.map((c) => {
              const slug = cardSlug(c.name);
              return (
                <Link
                  key={slug}
                  href={`/tarot/${slug}`}
                  className={`rounded-xl border p-3 text-center text-sm transition hover:scale-[1.02] ${slug === params["card-slug"] ? "border-cosmic-gold/50 bg-cosmic-gold/10" : "border-white/10 bg-white/[0.04] hover:bg-white/10"}`}
                >
                  <p className="font-semibold text-white">{c.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/15 to-cosmic-violet/10 p-8 text-center shadow-2xl shadow-cosmic-gold/10">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl">One card is a message. A full spread tells the story.</h2>
          <p className="mx-auto mb-8 max-w-2xl text-cosmic-lavender/80">
            A single card gives you guidance, but a full tarot spread reveals how the cards interact 
            to tell your story. Get a free personalized tarot reading with multiple cards and detailed interpretation.
          </p>
          <Link href="/tarot" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-cosmic-void transition hover:scale-[1.02]">
            Get Your Free Reading <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function MeaningCard({ variant, title, children }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-2xl shadow-black/20 backdrop-blur ${
      variant === "upright"
        ? "border-cosmic-gold/20 bg-gradient-to-br from-cosmic-gold/10 to-transparent"
        : "border-cosmic-rose/20 bg-gradient-to-br from-cosmic-rose/10 to-transparent"
    }`}>
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
        variant === "upright" ? "bg-cosmic-gold/15 text-cosmic-gold" : "bg-cosmic-rose/15 text-cosmic-rose"
      }`}>
        <Star className="h-5 w-5" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-white">{title}</h2>
      <p className="leading-7 text-cosmic-lavender/80">{children}</p>
    </div>
  );
}
