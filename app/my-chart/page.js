'use client';
const logger = require('../../lib/logger');

export const dynamic = 'force-static';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BirthChartWheel from '@/components/BirthChartWheel';
import { ArrowLeft, Loader2, Sparkles, Star } from 'lucide-react';

export default function MyChartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [birthInfo, setBirthInfo] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChart();
  }, []);

  const fetchChart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/birth-chart');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch birth chart');
      }

      const data = await response.json();
      
      if (!data.hasChart) {
        setError('No birth chart found. Please create one first.');
        setLoading(false);
        return;
      }

      setChartData(data.chart);
      setBirthInfo(data.birthInfo);
      setInterpretation(data.interpretation);
      setLoading(false);
    } catch (err) {
      logger.error('Error fetching chart:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading your natal chart...</p>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 text-purple-300">
            <Star className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Chart Found</h2>
          <p className="text-purple-200 mb-8">
            {error || "You haven't created a birth chart yet. Create one to unlock personalized astrological insights!"}
          </p>
          <Link
            href="/birth-chart"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Your Birth Chart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">My Natal Chart</h1>
                  <p className="text-purple-300 text-lg">Your cosmic blueprint</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/birth-chart?update=true"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg"
              >
                Update Chart
              </Link>
              <Link
                href="/birth-chart"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create New
              </Link>
            </div>
          </div>

          {birthInfo && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-purple-300 text-sm">Born</p>
                  <p className="text-white font-semibold">{birthInfo.date} at {birthInfo.time}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Location</p>
                  <p className="text-white font-semibold">{birthInfo.location}</p>
                </div>
                <div>
                  <p className="text-purple-300 text-sm">Coordinates</p>
                  <p className="text-white font-semibold">
                    {parseFloat(birthInfo.latitude).toFixed(2)}°, {parseFloat(birthInfo.longitude).toFixed(2)}°
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Wheel */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <BirthChartWheel chartData={chartData} birthInfo={birthInfo} />
          </div>
        </div>

        {/* Chart Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Planetary Positions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🪐</span> Planetary Positions
            </h2>
            <div className="space-y-3">
              {chartData.planets && Object.entries(chartData.planets)
                .filter(([name]) => !['northnode', 'southnode'].includes(name.toLowerCase()))
                .map(([planet, data]) => (
                  <div key={planet} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getPlanetEmoji(planet)}</span>
                      <div>
                        <p className="text-white font-medium capitalize">{planet}</p>
                        <p className="text-purple-300 text-sm">
                          {data.sign} {Math.floor(data.degree)}°
                          {data.retrograde && <span className="text-red-400 ml-2">℞</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Houses & Special Points */}
          <div className="space-y-6">
            
            {/* Special Points */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>✨</span> Special Points
              </h2>
              <div className="space-y-3">
                {chartData.chartRuler && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <span className="text-white font-medium">👑 Chart Ruler</span>
                    <span className="text-purple-200">{chartData.chartRuler}</span>
                  </div>
                )}
                {chartData.planets?.northnode && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white font-medium">☊ North Node</span>
                    <span className="text-purple-200">
                      {chartData.planets.northnode.sign} {Math.floor(chartData.planets.northnode.degree)}°
                    </span>
                  </div>
                )}
                {chartData.planets?.chiron && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white font-medium">⚷ Chiron</span>
                    <span className="text-purple-200">
                      {chartData.planets.chiron.sign} {Math.floor(chartData.planets.chiron.degree)}°
                    </span>
                  </div>
                )}
                {chartData.partOfFortune && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white font-medium">⊕ Part of Fortune</span>
                    <span className="text-purple-200">
                      {chartData.partOfFortune.sign} {Math.floor(chartData.partOfFortune.degree)}°
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Element & Modality Distribution */}
            {chartData.distribution && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">📊 Your Cosmic Blend</h2>
                
                <div className="mb-6">
                  <p className="text-purple-300 text-sm mb-3">Elements</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(chartData.distribution.elements).map(([elem, count]) => (
                      <div key={elem} className="flex items-center gap-2">
                        <span className="text-xl">{getElementEmoji(elem)}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getElementColor(elem)}`}
                              style={{ width: `${(count / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-white text-sm font-semibold w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-purple-300 text-sm mb-3">Modalities</p>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(chartData.distribution.modalities).map(([mod, count]) => (
                      <div key={mod} className="flex items-center gap-2">
                        <span className="text-white text-sm w-20 capitalize">{mod}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getModalityColor(mod)}`}
                              style={{ width: `${(count / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-white text-sm font-semibold w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interpretation */}
        {interpretation ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span>🔮</span> Your Natal Chart Interpretation
            </h2>
            <div className="prose prose-invert prose-lg max-w-none">
              <div className="text-purple-100 leading-relaxed whitespace-pre-line">
                {interpretation}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-sm bg-black/50"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                <span>🔮</span> Your Natal Chart Interpretation
              </h2>
              <div className="prose prose-invert prose-lg max-w-none mb-6 blur-sm select-none pointer-events-none">
                <div className="text-purple-100 leading-relaxed whitespace-pre-line">
                  {`Your birth chart reveals a fascinating cosmic blueprint. The positions of the planets at the moment of your birth create a unique astrological signature that shapes your personality, life path, and potential.

The Sun's placement indicates your core identity and ego expression, while the Moon reveals your emotional nature and inner needs. Your Rising sign (Ascendant) shows how you present yourself to the world and the mask you wear in social situations.

Each planet's position in your chart tells a different story: Mercury influences how you think and communicate, Venus shapes your relationships and values, Mars drives your actions and desires, and Jupiter brings expansion and growth opportunities.

The aspects between planets create dynamic relationships that add depth and complexity to your personality. Major aspects like conjunctions, oppositions, and trines reveal important themes and challenges in your life.

Your chart's elemental distribution shows whether you're primarily Fire (passionate and action-oriented), Earth (practical and grounded), Air (intellectual and communicative), or Water (emotional and intuitive).

This interpretation provides deep insights into your personality traits, strengths, challenges, and life purpose based on ancient astrological wisdom combined with modern psychological understanding.`}
                </div>
              </div>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch('/api/birth-chart/interpretation', {
                      method: 'POST'
                    });
                    const data = await response.json();
                    if (data.success) {
                      setInterpretation(data.interpretation);
                    } else if (response.status === 402) {
                      alert(`Insufficient credits. Interpretation requires ${data.cost || 3} credits.`);
                      window.location.href = '/pricing';
                    } else {
                      alert(data.error || 'Failed to generate interpretation');
                    }
                  } catch (error) {
                    alert('Failed to generate interpretation');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                <Sparkles className="w-5 h-5" />
                {loading ? 'Generating Interpretation...' : 'Unlock Full Analysis (3 Credits)'}
              </button>
              <p className="text-center text-purple-300 text-sm mt-3">
                Or <Link href="/subscription" className="text-yellow-400 hover:underline">upgrade to Premium</Link> to get interpretation included
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helper functions
function getPlanetEmoji(planet) {
  const emojis = {
    sun: '☀️',
    moon: '🌙',
    mercury: '☿️',
    venus: '💕',
    mars: '♂️',
    jupiter: '♃',
    saturn: '♄',
    uranus: '♅',
    neptune: '♆',
    pluto: '♇',
    chiron: '⚷'
  };
  return emojis[planet.toLowerCase()] || '⭐';
}

function getElementEmoji(element) {
  const emojis = {
    fire: '🔥',
    earth: '🌍',
    air: '💨',
    water: '💧'
  };
  return emojis[element] || '';
}

function getElementColor(element) {
  const colors = {
    fire: 'bg-red-500',
    earth: 'bg-green-500',
    air: 'bg-cyan-500',
    water: 'bg-blue-500'
  };
  return colors[element] || 'bg-gray-500';
}

function getModalityColor(modality) {
  const colors = {
    cardinal: 'bg-pink-500',
    fixed: 'bg-purple-500',
    mutable: 'bg-cyan-500'
  };
  return colors[modality] || 'bg-gray-500';
}

