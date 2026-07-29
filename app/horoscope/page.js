'use client';

import { useCallback, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodiacSigns } from '@/lib/zodiac-data';
import {
  Sparkles,
  Star,
  Loader2,
  ArrowLeft,
  Gem,
  Smile,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useApiClientWithToast } from '@/src/hooks/useApiClientWithToast';

const signEmojis = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

const signColors = {
  Aries: 'from-red-500 to-orange-500',
  Taurus: 'from-green-500 to-emerald-600',
  Gemini: 'from-yellow-400 to-amber-500',
  Cancer: 'from-slate-300 to-slate-400',
  Leo: 'from-yellow-500 to-amber-400',
  Virgo: 'from-amber-700 to-amber-800',
  Libra: 'from-pink-400 to-rose-400',
  Scorpio: 'from-gray-800 to-black',
  Sagittarius: 'from-purple-500 to-violet-500',
  Capricorn: 'from-green-800 to-emerald-900',
  Aquarius: 'from-blue-400 to-cyan-400',
  Pisces: 'from-teal-400 to-cyan-500'
};

function getSignEmoji(sign) {
  return signEmojis[sign] || '⭐';
}

function HoroscopePageInner() {
  const searchParams = useSearchParams();
  const urlSign = searchParams.get('sign');

  const [selectedSign, setSelectedSign] = useState(urlSign?.toLowerCase() || 'aries');
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refetch when picking a different sign so we don't keep serving stale cache.
  const pickSign = useCallback((sign) => {
    const next = (sign || '').toString().toLowerCase();
    setSelectedSign(next);
    setRefreshKey((k) => k + 1);
  }, []);

  const { data, loading, error, refetch } = useApiClientWithToast(
    apiClient,
    (c) => c.get(`/api/horoscope?sign=${selectedSign}`),
    [selectedSign, refreshKey],
    { toastMessages: { error: 'Could not load your horoscope. Check your connection.' } }
  );

  const signInfo = zodiacSigns.find(s => s.name.toLowerCase() === selectedSign);

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-semibold text-white tracking-tight">
                  Daily Horoscope
                </h1>
                <p className="text-purple-300 mt-1">
                  {data?.date ? new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-purple-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Sign Selector */}
        <div className="mb-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {zodiacSigns.map((sign) => {
              const signKey = sign.name.toLowerCase();
              const isSelected = selectedSign === signKey;
              return (
                <button
                  key={sign.name}
                  onClick={() => pickSign(signKey)}
                  className={`relative p-4 rounded-2xl transition-all duration-200 border ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-400 shadow-lg shadow-purple-500/30 scale-105'
                      : 'bg-white/5 text-purple-200 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-1">{getSignEmoji(sign.name)}</div>
                  <div className="text-xs sm:text-sm font-medium">{sign.name}</div>
                  <div className="text-[10px] sm:text-xs opacity-70 mt-0.5">{sign.dates}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-purple-300 text-lg">Reading the stars...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <p className="text-red-300 mb-4">{error.message}</p>
            <button
              onClick={refetch}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {data?.success && !loading && (
          <div className="space-y-6">
            {/* Main Horoscope Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${signColors[data.sign] || 'from-purple-500 to-pink-500'} flex items-center justify-center text-3xl shadow-lg`}>
                  {getSignEmoji(data.sign)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white capitalize">{data.sign}</h2>
                  <p className="text-purple-300">{signInfo?.dates}</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                {data.horoscope?.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-lg text-gray-200 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                )) || (
                  <p className="text-lg text-gray-200 leading-relaxed">{data.horoscope}</p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mood */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Smile className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Mood</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-300">{data.mood || 'Optimistic'}</p>
              </div>

              {/* Lucky Stone */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Gem className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Lucky Stone</h3>
                </div>
                <p className="text-2xl font-bold text-teal-300">{data.luckyStone || 'Clear Quartz'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HoroscopePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <HoroscopePageInner />
    </Suspense>
  );
}
