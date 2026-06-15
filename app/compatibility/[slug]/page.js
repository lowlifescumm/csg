import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heart, Users, MessageCircle, Sparkles, Star, Home, Shield, Zap } from 'lucide-react';
import { 
  getCompatibilityPair, 
  getAllCompatibilitySlugs,
  getPairsBySign
} from '@/lib/pseo/compatibility-data';
import { zodiacSignsEnriched, getSignByName } from '@/lib/pseo/astrology';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const slugs = getAllCompatibilitySlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const pair = getCompatibilityPair(params.slug);
  
  if (!pair) {
    return {
      title: 'Compatibility Not Found | Cosmic Spirit Guide'
    };
  }
  
  const title = `${pair.sign1} and ${pair.sign2} Compatibility: Love, Friendship & Romance | Cosmic Spirit Guide`;
  
  return {
    title,
    description: pair.metaDescription,
    keywords: pair.keywords.join(', '),
    openGraph: {
      title: `${pair.sign1} and ${pair.sign2} Compatibility`,
      description: pair.metaDescription,
      type: 'article',
    },
    alternates: {
      canonical: `https://cosmicspiritguide.com/compatibility/${params.slug}`,
    },
  };
}

function getScoreColor(score) {
  if (score >= 85) return 'from-emerald-400 to-green-600';
  if (score >= 70) return 'from-blue-400 to-cyan-500';
  if (score >= 55) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-pink-600';
}

function getScoreLabel(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 70) return 'Strong Compatibility';
  if (score >= 55) return 'Moderate Potential';
  return 'Challenging Pairing';
}

function getElementIcon(element) {
  const icons = {
    'Fire': '🔥',
    'Earth': '🌍',
    'Air': '💨',
    'Water': '💧'
  };
  return icons[element] || '✨';
}

function getElementDescription(element1, element2) {
  const combos = {
    'Fire-Fire': 'Passionate, energetic, and mutually inspiring',
    'Earth-Earth': 'Stable, grounded, and practically oriented',
    'Air-Air': 'Intellectual, communicative, and socially engaged',
    'Water-Water': 'Emotional, intuitive, and deeply connected',
    'Fire-Earth': 'Dynamic tension - Fire inspires, Earth grounds',
    'Earth-Fire': 'Dynamic tension - Earth grounds, Fire inspires',
    'Fire-Air': 'Energizing combination - Fire acts, Air fuels',
    'Air-Fire': 'Energizing combination - Air fuels, Fire acts',
    'Fire-Water': 'Steam or conflict - intense and transformative',
    'Water-Fire': 'Steam or conflict - transformative and intense',
    'Earth-Air': 'Challenging - different paces and priorities',
    'Air-Earth': 'Challenging - different paces and priorities',
    'Earth-Water': 'Nurturing combination - fertile and supportive',
    'Water-Earth': 'Nurturing combination - supportive and fertile',
    'Air-Water': 'Mist or clarity - communication meets emotion',
    'Water-Air': 'Mist or clarity - emotion meets communication'
  };
  return combos[`${element1}-${element2}`] || 'Unique elemental combination';
}

export default function CompatibilityPairPage({ params }) {
  const pair = getCompatibilityPair(params.slug);
  
  if (!pair) {
    notFound();
  }
  
  const sign1Data = getSignByName(pair.sign1);
  const sign2Data = getSignByName(pair.sign2);
  
  const scoreColor = getScoreColor(pair.score);
  const scoreLabel = getScoreLabel(pair.score);
  const elementDesc = getElementDescription(pair.element1, pair.element2);
  
  // Get related compatibility pairs (same sign1, different sign2)
  const relatedPairs = getPairsBySign(pair.sign1)
    .filter(p => p.sign2 !== pair.sign2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            {pair.sign1} and {pair.sign2} Compatibility
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            {pair.metaDescription}
          </p>
          
          {/* Compatibility Score Badge */}
          <div className="inline-block mb-8">
            <div className={`bg-gradient-to-r ${scoreColor} rounded-2xl p-1 shadow-2xl`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 text-center">
                <div className="text-7xl font-bold text-white mb-2">{pair.score}%</div>
                <div className="text-white/90 font-medium text-lg">{scoreLabel}</div>
              </div>
            </div>
          </div>
          
          {/* Sign Profiles Side by Side */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Link 
              href={`/zodiac/${sign1Data?.slug || pair.sign1.toLowerCase()}`}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="text-5xl mb-3">{sign1Data?.symbol}</div>
              <h2 className="text-2xl font-bold text-white mb-2">{pair.sign1}</h2>
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <span>{getElementIcon(pair.element1)}</span>
                <span>{pair.element1} • {sign1Data?.modality}</span>
              </div>
              <div className="mt-3 text-sm text-purple-300">Ruled by {sign1Data?.rulingPlanet}</div>
            </Link>
            
            <Link 
              href={`/zodiac/${sign2Data?.slug || pair.sign2.toLowerCase()}`}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="text-5xl mb-3">{sign2Data?.symbol}</div>
              <h2 className="text-2xl font-bold text-white mb-2">{pair.sign2}</h2>
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <span>{getElementIcon(pair.element2)}</span>
                <span>{pair.element2} • {sign2Data?.modality}</span>
              </div>
              <div className="mt-3 text-sm text-purple-300">Ruled by {sign2Data?.rulingPlanet}</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Element Dynamics */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Element Dynamics</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="px-4 py-2 bg-white/20 rounded-full text-white font-medium">
                {pair.element1} {getElementIcon(pair.element1)}
              </span>
              <span className="text-white/60">+</span>
              <span className="px-4 py-2 bg-white/20 rounded-full text-white font-medium">
                {pair.element2} {getElementIcon(pair.element2)}
              </span>
            </div>
            <p className="text-purple-200 text-lg">{elementDesc}</p>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Strengths */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Strengths of This Pairing</h2>
            </div>
            <ul className="space-y-3">
              {pair.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-3 text-purple-100">
                  <span className="text-yellow-400 mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Challenges */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Potential Challenges</h2>
            </div>
            <ul className="space-y-3">
              {pair.challenges.map((challenge, i) => (
                <li key={i} className="flex items-start gap-3 text-purple-100">
                  <span className="text-orange-400 mt-1">!</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Communication Style */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Communication Style</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed">{pair.communication}</p>
          </div>

          {/* Romantic Chemistry */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-pink-400" />
              <h2 className="text-2xl font-bold text-white">Romantic & Sexual Chemistry</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed">{pair.romantic}</p>
          </div>

          {/* Friendship */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Friendship Potential</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed">{pair.friendship}</p>
          </div>

          {/* Long-term Outlook */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Home className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Long-Term Outlook</h2>
            </div>
            <p className="text-purple-100 text-lg leading-relaxed">{pair.longTerm}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Calculate Your Full Compatibility Report
            </h2>
            <p className="text-purple-200 mb-6">
              Get a personalized birth chart compatibility analysis with detailed insights into your unique relationship dynamics.
            </p>
            <Link
              href="/compatibility"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all"
            >
              <Heart className="w-5 h-5" />
              Start Free Compatibility Test
            </Link>
          </div>
        </div>
      </section>

      {/* Related Compatibility */}
      {relatedPairs.length > 0 && (
        <section className="px-4 py-12 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              More {pair.sign1} Compatibility
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedPairs.map((related) => (
                <Link
                  key={related.slug}
                  href={`/compatibility/${related.slug}`}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                >
                  <div className="text-sm text-purple-300 mb-2">
                    {related.sign1} & {related.sign2}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    related.score >= 80 ? 'bg-green-500/30 text-green-300' :
                    related.score >= 60 ? 'bg-blue-500/30 text-blue-300' :
                    related.score >= 45 ? 'bg-amber-500/30 text-amber-300' :
                    'bg-rose-500/30 text-rose-300'
                  }`}>
                    {related.score}%
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cross Links */}
      <section className="px-4 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Explore More</h2>
          <div className="flex flex-wrap gap-3">
            <Link 
              href={`/zodiac/${sign1Data?.slug || pair.sign1.toLowerCase()}`}
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              {pair.sign1} Zodiac Sign →
            </Link>
            <Link 
              href={`/zodiac/${sign2Data?.slug || pair.sign2.toLowerCase()}`}
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              {pair.sign2} Zodiac Sign →
            </Link>
            <Link 
              href="/compatibility"
              className="text-purple-300 hover:text-white transition-colors underline"
            >
              Full Compatibility Calculator →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
