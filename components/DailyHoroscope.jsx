"use client";
import { useState, useEffect } from 'react';
import { zodiacSigns } from '@/lib/zodiac-data';

export default function DailyHoroscope({ userSign = null }) {
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);

  // Normalize sign name to lowercase
  const normalizedSign = userSign ? userSign.toLowerCase() : null;

  useEffect(() => {
    if (normalizedSign) {
      loadHoroscope(normalizedSign);
    }
  }, [normalizedSign]);

  const loadHoroscope = async (sign) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/horoscope?sign=${sign}`);
      const data = await response.json();
      if (data.success) {
        setHoroscope(data.horoscope);
      }
    } catch (error) {
      console.error('Failed to load horoscope:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignEmoji = (sign) => {
    const emojis = {
      Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
      Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
      Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
    };
    return emojis[sign] || '⭐';
  };

  if (!normalizedSign) {
    return (
      <div className="w-full">
        <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40">
          <h2 className="text-2xl font-semibold gradient-text mb-6">Daily Horoscope</h2>
          <div className="text-center py-12">
            <p className="text-gray-600">Please create a birth chart to see your personalized horoscope.</p>
          </div>
        </div>
      </div>
    );
  }

  const signInfo = zodiacSigns.find(s => s.name.toLowerCase() === normalizedSign);
  const displaySign = signInfo?.name || normalizedSign;

  return (
    <div className="w-full">
      <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40">
        <h2 className="text-2xl font-semibold gradient-text mb-6">Daily Horoscope</h2>

        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-gray-600">Reading the stars...</p>
          </div>
        ) : horoscope ? (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 apple-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">{getSignEmoji(displaySign)}</div>
              <div>
                <h3 className="text-2xl font-bold capitalize text-gray-900">{displaySign}</h3>
                <p className="text-sm text-gray-600">
                  {signInfo?.dates || ''}
                </p>
              </div>
            </div>
            <div className="prose prose-purple max-w-none">
              {horoscope.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-3 text-gray-800 leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
