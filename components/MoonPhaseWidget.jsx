"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sparkles, Calendar, Info } from 'lucide-react';

export default function MoonPhaseWidget() {
  const router = useRouter();
  const [moonData, setMoonData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoonData = async () => {
      try {
        const response = await fetch('/api/moon-phase');
        const result = await response.json();
        if (result.success) {
          setMoonData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch moon data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoonData();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin text-4xl">🌙</div>
        </div>
      </div>
    );
  }

  if (!moonData) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative p-6 pb-4">
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-4 left-4 text-white text-opacity-20">✨</div>
            <div className="absolute top-8 right-8 text-white text-opacity-20">⭐</div>
            <div className="absolute bottom-4 left-1/3 text-white text-opacity-20">✨</div>
          </div>
          
          <div className="relative flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-bold flex items-center gap-2">
              <Moon className="w-6 h-6" />
              Moon Phase
            </h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-white opacity-70 hover:opacity-100 transition-opacity"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <div className="relative">
              <div className="text-8xl">{moonData.phaseEmoji}</div>
              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {moonData.illumination}%
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-white text-3xl font-bold mb-1">
                {moonData.phaseName}
              </h3>
              <p className="text-purple-200 text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Moon in {moonData.zodiacSign}
              </p>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-200 to-yellow-400 h-full transition-all duration-1000 ease-out"
              style={{ width: `${moonData.illumination}%` }}
            />
          </div>
        </div>

        {!showDetails ? (
          <div className="bg-black bg-opacity-20 p-6">
            <p className="text-white text-sm leading-relaxed opacity-90">
              {moonData.guidance.energy}
            </p>
            <button
              onClick={() => setShowDetails(true)}
              className="mt-4 text-purple-200 text-sm hover:text-white transition-colors flex items-center gap-1"
            >
              See detailed guidance
              <span className="text-xs">→</span>
            </button>
          </div>
        ) : (
          <div className="bg-black bg-opacity-20 p-6 space-y-4">
            <div>
              <h4 className="text-purple-200 text-xs uppercase font-semibold mb-2 flex items-center gap-1">
                <span className="text-green-400">✓</span> Best For
              </h4>
              <ul className="space-y-1">
                {moonData.guidance.bestFor.map((item, i) => (
                  <li key={i} className="text-white text-sm opacity-90 pl-4">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-purple-200 text-xs uppercase font-semibold mb-2 flex items-center gap-1">
                <span className="text-red-400">✗</span> Avoid
              </h4>
              <ul className="space-y-1">
                {moonData.guidance.avoid.map((item, i) => (
                  <li key={i} className="text-white text-sm opacity-90 pl-4">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-purple-800 bg-opacity-30 rounded-lg p-4">
              <h4 className="text-purple-200 text-xs uppercase font-semibold mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Moon Ritual
              </h4>
              <p className="text-white text-sm opacity-90">
                {moonData.guidance.ritual}
              </p>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="text-purple-200 text-sm hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        <div className="bg-black bg-opacity-30 p-6">
          <h4 className="text-purple-200 text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming Phases
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {moonData.nextPhases.map((phase, i) => (
              <div 
                key={i}
                className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition-all"
              >
                <div className="text-2xl mb-1">{phase.emoji}</div>
                <div className="text-white text-sm font-medium">{phase.name}</div>
                <div className="text-purple-200 text-xs">{phase.date}</div>
                <div className="text-purple-300 text-xs mt-1">
                  in {phase.daysUntil} days
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-center shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h3 className="text-white text-lg font-bold">Want More Insight?</h3>
        </div>
        <p className="text-purple-100 text-sm mb-4">
          Get a personalized moon reading based on YOUR birth chart
        </p>
        <button 
          onClick={() => router.push('/moon-reading')}
          className="w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          Get Your Personalized Moon Reading
          <span className="text-lg">✨</span>
        </button>
        <p className="text-purple-200 text-xs mt-3">
          Includes natal moon analysis, timing guidance & custom rituals
        </p>
      </div>

      <div className="text-center mt-4 text-gray-500 text-xs">
        Updates daily at midnight
      </div>
    </div>
  );
}
