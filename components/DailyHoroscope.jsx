"use client";
import { useState, useEffect } from 'react';
import { zodiacSigns } from '@/lib/zodiac-data';

export default function DailyHoroscope({ userSign = null }) {
  const [selectedSign, setSelectedSign] = useState(userSign || 'aries');
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHoroscope(selectedSign);
  }, [selectedSign]);

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

  return (
    <div className="w-full">
      <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40">
        <h2 className="text-2xl font-semibold gradient-text mb-6">Daily Horoscope</h2>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-6">
          {zodiacSigns.map(sign => (
            <button
              key={sign.name}
              onClick={() => setSelectedSign(sign.name.toLowerCase())}
              className={`p-3 rounded-xl smooth-transition ${
                selectedSign === sign.name.toLowerCase()
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white apple-shadow-lg scale-105'
                  : 'bg-white bg-opacity-60 text-gray-700 hover:bg-opacity-80 apple-shadow hover:scale-105'
              }`}
            >
              <div className="text-2xl mb-1">{getSignEmoji(sign.name)}</div>
              <div className="text-xs font-medium">{sign.name}</div>
            </button>
          ))}
        </div>

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
              <div className="text-4xl">{getSignEmoji(zodiacSigns.find(s => s.name.toLowerCase() === selectedSign)?.name || '')}</div>
              <div>
                <h3 className="text-2xl font-bold capitalize text-gray-900">{selectedSign}</h3>
                <p className="text-sm text-gray-600">
                  {zodiacSigns.find(s => s.name.toLowerCase() === selectedSign)?.dates}
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
