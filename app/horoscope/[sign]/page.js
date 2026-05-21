'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, Heart, TrendingUp, Activity, Loader2 } from 'lucide-react';

const zodiacSigns = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire', icon: '🔥' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth', icon: '🌍' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air', icon: '💨' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water', icon: '🌊' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire', icon: '🔥' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth', icon: '🌍' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air', icon: '💨' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water', icon: '🌊' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire', icon: '🔥' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth', icon: '🌍' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air', icon: '💨' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water', icon: '🌊' },
];

const elementColors = {
  Fire: 'from-orange-500 to-red-600',
  Earth: 'from-green-500 to-emerald-600',
  Air: 'from-sky-500 to-blue-600',
  Water: 'from-cyan-500 to-blue-600',
};

export default function SignHoroscopePage() {
  const params = useParams();
  const router = useRouter();
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const signName = params.sign;
  const sign = zodiacSigns.find(s => s.name.toLowerCase() === signName?.toLowerCase());

  useEffect(() => {
    if (!sign) {
      router.push('/horoscope');
      return;
    }

    fetchHoroscope(sign.name.toLowerCase());
  }, [sign, signName, router]);

  const fetchHoroscope = async (signSlug) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/horoscope?sign=${signSlug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch horoscope');
      }

      const data = await response.json();
      setHoroscope(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!sign) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Consulting the stars...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load horoscope</p>
          <Link href="/horoscope" className="text-purple-400 hover:text-purple-300">
            ← Back to all signs
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-black">
      <div className={`fixed inset-0 bg-gradient-to-br ${elementColors[sign.element]} opacity-20`} />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <Link
          href="/horoscope"
          className="inline-flex items-center gap-2 text-purple-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          All Signs
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${elementColors[sign.element]} flex items-center justify-center shadow-2xl mx-auto mb-6`}>
            <span className="text-5xl">{sign.symbol}</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">{sign.name}</h1>
          <p className="text-purple-300 text-lg">{sign.dates}</p>
          <p className="text-purple-400 text-sm mt-2">{today}</p>
        </div>

        {/* Horoscope Content */}
        {horoscope && (
          <div className="space-y-6">
            {/* Main Reading */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Your Daily Reading</h2>
              </div>
              <div className="text-white/80 text-lg leading-relaxed whitespace-pre-line">
                {horoscope.horoscope}
              </div>
            </div>

            {/* Lucky Numbers & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-2xl rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Lucky Numbers</h3>
                </div>
                <div className="flex gap-3">
                  {horoscope.luckyNumbers?.map((num, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{num}</span>
                    </div>
                  )) || [7, 14, 21, 28].map((num, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{num}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-2xl rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Lucky Color</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl shadow-lg"
                    style={{ backgroundColor: horoscope.luckyColor?.toLowerCase() || '#9333ea' }}
                  />
                  <span className="text-white font-semibold text-lg">
                    {horoscope.luckyColor || 'Purple'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mood */}
            {horoscope.mood && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-2xl rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <span className="text-white/80">Today&apos;s Mood: </span>
                  <span className="text-white font-bold">{horoscope.mood}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Want More Personalized Guidance?
          </h2>
          <p className="text-purple-200 mb-6">
            Get your full birth chart with transits for deeper insights
          </p>
          <Link
            href="/birth-chart"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50"
          >
            Create Your Birth Chart
          </Link>
        </div>
      </div>
    </div>
  );
}
