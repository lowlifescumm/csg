'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, AlertTriangle, Sparkles, Calendar, 
  Bell, ChevronRight, Clock, Star, Heart, Briefcase, 
  Users, Brain, Home, Activity, ArrowLeft, Share2, Loader2, Lock
} from 'lucide-react';
import Link from 'next/link';

export default function TransitDashboard() {
  const [selectedTransit, setSelectedTransit] = useState(null);
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [requiresPremium, setRequiresPremium] = useState(false);
  const [needsBirthChart, setNeedsBirthChart] = useState(false);

  useEffect(() => {
    fetchTransits();
  }, []);

  const fetchTransits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transits');
      
      if (response.status === 402) {
        const data = await response.json();
        setRequiresPremium(true);
        setLoading(false);
        return;
      }

      if (response.status === 400) {
        const data = await response.json();
        if (data.needsBirthChart) {
          setNeedsBirthChart(true);
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch transits');
      }

      const transitData = await response.json();
      setData(transitData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading your cosmic transits...</p>
        </div>
      </div>
    );
  }

  if (requiresPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
              <Lock className="w-10 h-10 text-pink-300" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Premium Feature</h1>
            <p className="text-xl text-purple-200">Transit Dashboard requires an active premium subscription</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-white mb-2">$29.99</div>
              <div className="text-purple-200">per month</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">Unlimited transit dashboard access</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">4 moon reading credits/month</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">2 compatibility report credits/month</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">2 birth chart credits/month</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div className="text-white">Unlimited tarot readings</div>
              </div>
            </div>

            <Link
              href="/subscription"
              className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-center"
            >
              Upgrade to Premium
            </Link>

            <Link
              href="/dashboard"
              className="block w-full mt-4 bg-white bg-opacity-20 text-white font-bold py-4 rounded-lg hover:bg-opacity-30 transition-all text-center"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (needsBirthChart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
            <Star className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Birth Chart Required</h1>
            <p className="text-purple-200 mb-8">
              To view your personalized transit dashboard, you need to create your birth chart first.
            </p>
            <Link
              href="/birth-chart"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Create Birth Chart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Error Loading Transits</h1>
            <p className="text-purple-200 mb-8">{error}</p>
            <button
              onClick={fetchTransits}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTransit) {
    return <TransitDetailView transit={selectedTransit} onBack={() => setSelectedTransit(null)} />;
  }

  if (!data || !data.transits || !data.stats || !data.userChart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">Unable to load transit data</p>
          <button
            onClick={fetchTransits}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { transits, stats, userChart } = data;
  const currentIntensity = stats.averageIntensity;

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-semibold text-white tracking-tight">
                    Transit Dashboard
                  </h1>
                  <p className="text-purple-300 mt-1">Real-time cosmic influences</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard" className="text-purple-300 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg">
                  ☀️
                </div>
                <div>
                  <div className="text-xs text-purple-300 font-medium mb-1">Sun Sign</div>
                  <div className="text-2xl font-semibold text-white">{userChart.sunSign}</div>
                </div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-3xl shadow-lg">
                  🌙
                </div>
                <div>
                  <div className="text-xs text-purple-300 font-medium mb-1">Moon Sign</div>
                  <div className="text-2xl font-semibold text-white">{userChart.moonSign}</div>
                </div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
                  ⬆️
                </div>
                <div>
                  <div className="text-xs text-purple-300 font-medium mb-1">Rising Sign</div>
                  <div className="text-2xl font-semibold text-white">{userChart.risingSign}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
          <div className="relative">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-sm font-medium text-purple-300 mb-2 tracking-wide uppercase">Today's Energy</div>
                <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  {currentIntensity}/10
                </h2>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-sm mb-2">Intensity Level</div>
                <div className="text-2xl font-semibold text-white">
                  {currentIntensity >= 8 ? 'High Energy ⚡' : currentIntensity >= 5 ? 'Moderate 🌟' : 'Calm 🕊️'}
                </div>
              </div>
            </div>
            
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full transition-all duration-1000 relative"
                style={{ width: `${currentIntensity * 10}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-3xl font-bold text-white mb-1">{stats.majorCount}</div>
                <div className="text-sm text-purple-300">Major Transits</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl mb-2">⚠️</div>
                <div className="text-3xl font-bold text-white mb-1">{stats.moderateCount}</div>
                <div className="text-sm text-purple-300">Moderate</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl mb-2">✨</div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalActive}</div>
                <div className="text-sm text-purple-300">Active Now</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {['Today', 'This Week', 'This Month'].map((label, idx) => {
            const value = ['today', 'week', 'month'][idx];
            return (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  timeframe === value
                    ? 'bg-white text-black shadow-lg shadow-white/25'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Critical Transits
          </h3>
          <div className="space-y-4">
            {transits.filter(t => t.type === 'major').map((transit) => (
              <TransitCard 
                key={`${transit.transitPlanet}-${transit.natalPlanet}`}
                transit={transit} 
                onClick={() => setSelectedTransit(transit)}
              />
            ))}
          </div>
        </div>

        {transits.filter(t => t.type === 'moderate').length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Moderate Transits
            </h3>
            <div className="space-y-4">
              {transits.filter(t => t.type === 'moderate').map((transit) => (
                <TransitCard 
                  key={`${transit.transitPlanet}-${transit.natalPlanet}`}
                  transit={transit} 
                  onClick={() => setSelectedTransit(transit)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TransitCard({ transit, onClick }) {
  const getColorClass = (color) => {
    const colors = {
      red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
      orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
      green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
    };
    return colors[color] || colors.purple;
  };

  const getEmoji = (aspectNature) => {
    if (aspectNature === 'challenging') return '⚡';
    if (aspectNature === 'beneficial') return '✨';
    return '🌟';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-r ${getColorClass(transit.color)} backdrop-blur-2xl rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{getEmoji(transit.aspectNature)}</span>
            <div>
              <h4 className="text-xl font-bold text-white">
                {transit.transitPlanetName} {transit.aspect} {transit.natalPlanetName}
              </h4>
              <p className="text-white/60 text-sm">
                {transit.transitPlanetName} in {transit.transitSign} → {transit.natalPlanetName} in {transit.natalSign}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{transit.intensity}/10</div>
            <div className="text-xs text-white/60">Intensity</div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white/80 transition-colors" />
        </div>
      </div>

      {transit.interpretation && (
        <p className="text-white/80 mb-4 line-clamp-2">{transit.interpretation.summary}</p>
      )}

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/60" />
          <span className="text-white/80">
            {transit.daysUntilPeak === 0 ? 'Exact today' : `${transit.daysUntilPeak} days until peak`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-white/60" />
          <span className="text-white/80">{transit.affectedArea}</span>
        </div>
      </div>
    </div>
  );
}

function TransitDetailView({ transit, onBack }) {
  const [interpretation, setInterpretation] = useState(transit.interpretation);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);

  useEffect(() => {
    if (!transit.interpretation || !transit.interpretation.fullGuidance) {
      fetchInterpretation();
    }
  }, []);

  const fetchInterpretation = async () => {
    try {
      setLoadingInterpretation(true);
      const response = await fetch('/api/transits/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transit }),
      });

      const data = await response.json();

      if (response.status === 401 && data.requiresAuth) {
        setInterpretation({
          summary: 'Your session has expired. Please log in again to view this interpretation.',
          fullGuidance: '',
          timing: '',
          areas: { career: '', relationships: '', wellness: '' },
          advice: []
        });
        return;
      }

      if (response.status === 402 && data.requiresPremium) {
        setInterpretation({
          summary: 'This feature requires an active premium subscription. Upgrade to unlock full transit interpretations.',
          fullGuidance: '',
          timing: '',
          areas: { career: '', relationships: '', wellness: '' },
          advice: []
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch interpretation');
      }

      setInterpretation(data.interpretation);
    } catch (error) {
      console.error('Error fetching interpretation:', error);
      setInterpretation({
        summary: 'Unable to generate interpretation. Please try again later.',
        fullGuidance: '',
        timing: '',
        areas: { career: '', relationships: '', wellness: '' },
        advice: []
      });
    } finally {
      setLoadingInterpretation(false);
    }
  };

  const getColorGradient = (color) => {
    const gradients = {
      red: 'from-red-600 to-rose-600',
      orange: 'from-orange-600 to-amber-600',
      green: 'from-green-600 to-emerald-600',
      purple: 'from-purple-600 to-pink-600'
    };
    return gradients[color] || gradients.purple;
  };

  const displayInterpretation = interpretation && interpretation.summary ? interpretation : {
    summary: 'Loading interpretation...',
    fullGuidance: '',
    timing: '',
    areas: { career: '', relationships: '', wellness: '' },
    advice: []
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className={`bg-gradient-to-r ${getColorGradient(transit.color)} rounded-3xl p-8 mb-8 shadow-2xl`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {transit.transitPlanetName} {transit.aspect} {transit.natalPlanetName}
              </h1>
              <p className="text-white/80 text-lg">
                {transit.transitPlanetName} in {transit.transitSign} → {transit.natalPlanetName} in {transit.natalSign}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white">{transit.intensity}/10</div>
              <div className="text-white/80">Intensity</div>
            </div>
          </div>

          {loadingInterpretation ? (
            <div className="flex items-center gap-3 text-white/80">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-xl">Generating personalized interpretation...</p>
            </div>
          ) : (
            <p className="text-xl text-white/90">{displayInterpretation.summary}</p>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Full Guidance</h2>
          {loadingInterpretation ? (
            <div className="flex items-center gap-3 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading detailed guidance...</p>
            </div>
          ) : (
            <p className="text-white/80 text-lg leading-relaxed mb-6">{displayInterpretation.fullGuidance}</p>
          )}
          
          <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timing
            </h3>
            <p className="text-white/80">{displayInterpretation.timing || 'Loading...'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Career
              </h3>
              <p className="text-white/80">{displayInterpretation.areas.career || 'Loading...'}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Relationships
              </h3>
              <p className="text-white/80">{displayInterpretation.areas.relationships || 'Loading...'}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Wellness
              </h3>
              <p className="text-white/80">{displayInterpretation.areas.wellness || 'Loading...'}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Action Steps
            </h3>
            {loadingInterpretation ? (
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>Generating action steps...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayInterpretation.advice.map((advice, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white font-semibold text-sm">{idx + 1}</span>
                    </div>
                    <p className="text-white/90">{advice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
