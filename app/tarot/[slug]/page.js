import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, BookOpen, Star, Sun, Moon, ChevronRight } from 'lucide-react';
import { getCardBySlug, getAllCardSlugs, getCardsByZodiacSign, getSuitData } from '@/lib/pseo/tarot-data';
import { zodiacSignsEnriched, getSignByName } from '@/lib/pseo/astrology';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const slugs = getAllCardSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const card = getCardBySlug(params.slug);
  
  if (!card) {
    return {
      title: 'Tarot Card Not Found | Cosmic Spirit Guide'
    };
  }
  
  const title = `${card.name} Tarot Card Meaning: Upright & Reversed | Cosmic Spirit Guide`;
  
  return {
    title,
    description: card.description,
    keywords: card.keywords?.join(', ') || 'tarot, ' + card.name.toLowerCase(),
    openGraph: {
      title: `${card.name} Tarot Meaning`,
      description: card.description,
      type: 'article',
    },
    alternates: {
      canonical: `https://cosmicspiritguide.com/tarot/${params.slug}`,
    },
  };
}

function getSuitIcon(suit) {
  const icons = {
    'Wands': '🔥',
    'Cups': '💧',
    'Swords': '💨',
    'Pentacles': '🌍',
    'major-arcana': '⭐'
  };
  return icons[suit] || '✨';
}

function getSuitColor(suit) {
  const colors = {
    'Wands': 'from-orange-500 to-red-500',
    'Cups': 'from-blue-500 to-indigo-600',
    'Swords': 'from-sky-400 to-blue-500',
    'Pentacles': 'from-green-500 to-emerald-600',
    'major-arcana': 'from-purple-500 to-pink-500'
  };
  return colors[suit] || 'from-purple-500 to-pink-500';
}

export default function TarotCardPage({ params }) {
  const card = getCardBySlug(params.slug);
  
  if (!card) {
    notFound();
  }
  
  const suitColor = getSuitColor(card.category === 'major-arcana' ? 'major-arcana' : card.suit);
  const suitIcon = getSuitIcon(card.category === 'major-arcana' ? 'major-arcana' : card.suit);
  
  // Get associated zodiac signs
  const associatedSigns = card.zodiac?.map(planet => {
    const signName = planet; // card.zodiac includes planet names and sign names
    // Try to find matching zodiac sign
    const sign = zodiacSignsEnriched.find(s => 
      s.name.toLowerCase() === signName.toLowerCase() ||
      s.rulingPlanet.toLowerCase() === signName.toLowerCase()
    );
    return sign;
  }).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center justify-center w-20 h-24 bg-gradient-to-r ${suitColor} rounded-xl mb-6 shadow-2xl border-2 border-white/30`}>
            <span className="text-4xl">{suitIcon}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            {card.name}
          </h1>
          <p className="text-lg text-purple-300 mb-2">
            {card.category === 'major-arcana' ? 'Major Arcana' : `${card.suit} Suit`}
          </p>
          <p className="text-lg text-purple-200 max-w-2xl mx-auto">
            {card.description}
          </p>
        </div>
      </section>

      {/* Card Meanings */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Upright Meaning */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500 rounded-full">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Upright Meaning</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed mb-4">
              {card.upright}
            </p>
            <p className="text-purple-200">
              When {card.name} appears upright in a reading, it signifies positive energy aligned with the card's natural attributes. This is a time to embrace the card's core message and allow its energy to guide your path forward.
            </p>
          </div>

          {/* Reversed Meaning */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500 rounded-full">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Reversed Meaning</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed mb-4">
              {card.reversed}
            </p>
            <p className="text-purple-200">
              When {card.name} appears reversed, it may indicate blocked energy, internal reflection needed, or the card's message manifesting in a more subtle or challenging way. Consider where resistance or shadow aspects might be at play.
            </p>
          </div>
        </div>
      </section>

      {/* Zodiac Associations */}
      {associatedSigns.length > 0 && (
        <section className="px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Zodiac Associations</h2>
              </div>
              <p className="text-purple-200 mb-6">
                {card.name} resonates with these zodiac signs through planetary rulership and elemental harmony.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {associatedSigns.map((sign) => (
                  <Link
                    key={sign.slug}
                    href={`/zodiac/${sign.slug}`}
                    className="group flex items-center gap-4 bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl">
                      {sign.symbol}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {sign.name}
                      </h3>
                      <p className="text-sm text-purple-300">
                        {sign.element} • {sign.rulingPlanet}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA - Free Tarot Reading */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Get a Personalized Tarot Reading
            </h2>
            <p className="text-purple-200 mb-6">
              Draw three cards for insight into your past, present, and future. Our AI-powered readings provide personalized guidance for your unique situation.
            </p>
            <Link
              href="/free-tarot"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Start Free Tarot Reading
            </Link>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="px-4 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/free-tarot"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tarot
          </Link>
        </div>
      </section>

      {/* Cross Links */}
      <section className="px-4 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Explore More</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/free-tarot"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Free Tarot Reading →
            </Link>
            <Link 
              href="/zodiac"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Zodiac Signs →
            </Link>
            <Link 
              href="/compatibility"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Compatibility Calculator →
            </Link>
            <Link 
              href="/birth-chart"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Free Birth Chart →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
