"use client";
const logger = require('@/lib/logger');
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
      logger.error('Failed to load horoscope:', error);
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

  // Ensure userSign is set on mount if provided
  useEffect(() => {
    if (userSign && !selectedSign) {
      setSelectedSign(userSign.toLowerCase());
    }
  }, [userSign]);

  const isUserSign = (signName) => {
    return userSign && signName.toLowerCase() === userSign.toLowerCase();
  };

  return (
    <div className="w-full">
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40">
        <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-6">Daily Horoscope</h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 mb-6">
          {zodiacSigns.map(sign => {
            const signKey = sign.name.toLowerCase();
            const isSelected = selectedSign === signKey;
            const isUser = isUserSign(sign.name);
            
            return (
              <button
                key={sign.name}
                onClick={() => setSelectedSign(signKey)}
                className={`p-3 sm:p-4 rounded-xl smooth-transition relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white apple-shadow-lg scale-105 border-2 border-white border-opacity-50'
                    : 'bg-white bg-opacity-10 text-purple-200 hover:bg-opacity-20 apple-shadow hover:scale-105 border border-white border-opacity-20'
                }`}
                title={isUser ? 'Your sign' : `Read ${sign.name} horoscope`}
              >
                {isUser && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-purple-900"></div>
                )}
                <div className="text-2xl sm:text-3xl mb-1">{getSignEmoji(sign.name)}</div>
                <div className="text-xs sm:text-sm font-medium truncate">{sign.name}</div>
              </button>
            );
          })}
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
          <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 p-6 sm:p-8 rounded-2xl border border-white border-opacity-30 apple-shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl">{getSignEmoji(zodiacSigns.find(s => s.name.toLowerCase() === selectedSign)?.name || '')}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-bold capitalize text-white">{selectedSign}</h3>
                  {isUserSign(selectedSign) && (
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-400/30 text-yellow-200 rounded-full border border-yellow-400/50">
                      Your Sign
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-purple-200 mt-1">
                  {zodiacSigns.find(s => s.name.toLowerCase() === selectedSign)?.dates}
                </p>
              </div>
            </div>
            <div className="prose prose-purple max-w-none">
              {horoscope.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-3 sm:mb-4 text-white leading-relaxed text-sm sm:text-base">{paragraph}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
