import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, Heart, Briefcase, Users, Star, Flame, Droplets, Wind, Mountain,
  Sun, Moon, Calendar, ChevronRight, ArrowRight
} from 'lucide-react';
import { 
  zodiacSignsEnriched, 
  getSignBySlug,
  getAllSlugs
} from '@/lib/pseo/astrology';
import { 
  getPairsBySign 
} from '@/lib/pseo/compatibility-data';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const sign = getSignBySlug(params.slug);
  
  if (!sign) {
    return {
      title: 'Zodiac Sign Not Found | Cosmic Spirit Guide'
    };
  }
  
  const title = `${sign.name} Zodiac Sign: Traits, Compatibility, Dates & Meaning | Cosmic Spirit Guide`;
  
  return {
    title,
    description: sign.metaDescription,
    keywords: sign.keywords.join(', '),
    openGraph: {
      title: `${sign.name} Zodiac Sign`,
      description: sign.metaDescription,
      type: 'article',
    },
    alternates: {
      canonical: `https://cosmicspiritguide.com/zodiac/${params.slug}`,
    },
  };
}

function getElementIcon(element) {
  const icons = {
    'Fire': <Flame className="w-5 h-5" />,
    'Earth': <Mountain className="w-5 h-5" />,
    'Air': <Wind className="w-5 h-5" />,
    'Water': <Droplets className="w-5 h-5" />
  };
  return icons[element] || <Star className="w-5 h-5" />;
}

function getElementColor(element) {
  const colors = {
    'Fire': 'from-orange-500 to-red-500',
    'Earth': 'from-green-500 to-emerald-600',
    'Air': 'from-sky-400 to-blue-500',
    'Water': 'from-blue-500 to-indigo-600'
  };
  return colors[element] || 'from-purple-500 to-pink-500';
}

function getQualityDescription(quality) {
  const descriptions = {
    'Cardinal': 'Initiators who start new seasons and projects',
    'Fixed': 'Stabilizers who maintain and sustain energy',
    'Mutable': 'Adaptable transformers who bridge seasons'
  };
  return descriptions[quality] || 'Unique zodiac quality';
}

function getRulingPlanetInfo(planet) {
  const info = {
    'Mars': { symbol: '♂', meaning: 'Action, courage, passion' },
    'Venus': { symbol: '♀', meaning: 'Love, beauty, harmony' },
    'Mercury': { symbol: '☿', meaning: 'Communication, intellect' },
    'Moon': { symbol: '☽', meaning: 'Emotions, intuition, nurturing' },
    'Sun': { symbol: '☉', meaning: 'Identity, vitality, ego' },
    'Pluto': { symbol: '♇', meaning: 'Transformation, power' },
    'Jupiter': { symbol: '♃', meaning: 'Expansion, luck, wisdom' },
    'Saturn': { symbol: '♄', meaning: 'Discipline, structure, karma' },
    'Uranus': { symbol: '♅', meaning: 'Innovation, rebellion, freedom' },
    'Neptune': { symbol: '♆', meaning: 'Dreams, intuition, spirituality' }
  };
  return info[planet] || { symbol: '★', meaning: 'Cosmic influence' };
}

function getTarotSlug(cardName) {
  return cardName.toLowerCase().replace(/ /g, '-');
}

export default function ZodiacSignPage({ params }) {
  const sign = getSignBySlug(params.slug);
  
  if (!sign) {
    notFound();
  }
  
  const elementColor = getElementColor(sign.element);
  const planetInfo = getRulingPlanetInfo(sign.rulingPlanet);
  
  // Get compatibility pairs for this sign
  const compatibilityPairs = getPairsBySign(sign.name)
    .sort((a, b) => b.score - a.score);
  
  const bestMatches = compatibilityPairs
    .filter(p => p.score >= 80)
    .slice(0, 3);
  
  const challengingMatches = compatibilityPairs
    .filter(p => p.score < 60)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r ${elementColor} rounded-full mb-6 shadow-2xl`}>
            <span className="text-6xl">{sign.symbol}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            {sign.name}
          </h1>
          <p className="text-xl text-purple-200 mb-6 max-w-2xl mx-auto">
            {sign.dates} • {sign.element} Sign • {sign.quality} Quality
          </p>
          <p className="text-lg text-purple-300 max-w-2xl mx-auto">
            {sign.metaDescription}
          </p>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Element */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${elementColor} rounded-full mb-3`}>
                {getElementIcon(sign.element)}
              </div>
              <div className="text-sm text-purple-300 mb-1">Element</div>
              <div className="text-lg font-bold text-white">{sign.element}</div>
            </div>
            
            {/* Quality */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-purple-300 mb-1">Quality</div>
              <div className="text-lg font-bold text-white">{sign.quality}</div>
            </div>
            
            {/* Ruling Planet */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-600 rounded-full mb-3">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-purple-300 mb-1">Ruling Planet</div>
              <div className="text-lg font-bold text-white">{sign.rulingPlanet}</div>
            </div>
            
            {/* Dates */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-600 rounded-full mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-purple-300 mb-1">Dates</div>
              <div className="text-lg font-bold text-white">{sign.dates}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Love & Relationships */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-pink-500 rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Love & Relationships</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed">
              {sign.loveTraits}
            </p>
          </div>
        </div>
      </section>

      {/* Career & Money */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500 rounded-full">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Career & Money</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed">
              {sign.careerTraits}
            </p>
          </div>
        </div>
      </section>

      {/* Compatible Signs */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Best Matches */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Best Matches</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bestMatches.map((match) => {
                const otherSign = match.sign1 === sign.name ? match.sign2 : match.sign1;
                const otherSlug = otherSign.toLowerCase();
                return (
                  <Link
                    key={match.slug}
                    href={`/compatibility/${match.slug}`}
                    className="group bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-white">{otherSign}</span>
                      <span className="text-2xl font-bold text-green-400">{match.score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-300">
                      <span>{match.element1 === match.element2 ? 'Same Element' : 'Complementary'}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link 
                href="/compatibility"
                className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
              >
                View All Compatibility Matches
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Challenging Matches */}
          {challengingMatches.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Challenging Matches</h2>
              </div>
              <p className="text-purple-200 mb-6">
                These pairings require more effort and understanding, but can lead to significant personal growth.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {challengingMatches.map((match) => {
                  const otherSign = match.sign1 === sign.name ? match.sign2 : match.sign1;
                  return (
                    <Link
                      key={match.slug}
                      href={`/compatibility/${match.slug}`}
                      className="group bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold text-white">{otherSign}</span>
                        <span className="text-2xl font-bold text-amber-400">{match.score}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-300">
                        <span>Growth Opportunity</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Associated Tarot Cards */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500 rounded-full">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Associated Tarot Cards</h2>
            </div>
            <p className="text-purple-200 mb-6">
              These tarot cards resonate with {sign.name}'s energy and offer insights into your spiritual journey.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {sign.associatedTarotCards.map((card) => (
                <Link
                  key={card}
                  href={`/tarot/${getTarotSlug(card)}`}
                  className="group flex items-center gap-4 bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                >
                  <div className="flex-shrink-0 w-12 h-16 bg-gradient-to-b from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🃏</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {card}
                    </h3>
                    <p className="text-sm text-purple-300">
                      {card.includes('of') ? 'Minor Arcana' : 'Major Arcana'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link 
                href="/free-tarot"
                className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
              >
                Get a Free Tarot Reading
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Free Birth Chart */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <Moon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Discover Your Complete Astrological Profile
            </h2>
            <p className="text-purple-200 mb-6">
              Your Sun sign is just the beginning. Get your free personalized birth chart to understand your Moon, Rising, and all planetary placements.
            </p>
            <Link
              href="/birth-chart"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all"
            >
              <Star className="w-5 h-5" />
              Create Your Free Birth Chart
            </Link>
          </div>
        </div>
      </section>

      {/* Navigation to Other Signs */}
      <section className="px-4 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Explore Other Zodiac Signs</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {zodiacSignsEnriched
              .filter(s => s.slug !== sign.slug)
              .map(otherSign => (
                <Link
                  key={otherSign.slug}
                  href={`/zodiac/${otherSign.slug}`}
                  className="text-center p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
                >
                  <div className="text-2xl mb-1">{otherSign.symbol}</div>
                  <div className="text-sm text-purple-300">{otherSign.name}</div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Cross Links */}
      <section className="px-4 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Explore More</h2>
          <div className="flex flex-wrap gap-4">
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
            <Link 
              href="/free-tarot"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Free Tarot Reading →
            </Link>
            <Link 
              href="/forecasts"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Daily Horoscopes →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
