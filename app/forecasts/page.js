'use client';

export const dynamic = 'force-static';

import { useState, useEffect } from 'react';
import { 
  Calendar, Star, Sparkles, TrendingUp, AlertTriangle, 
  Clock, Target, ArrowLeft, Loader2, Plus, Settings
} from 'lucide-react';
import Link from 'next/link';

export default function ForecastsPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    fetchForecasts();
  }, [range]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forecasts?range=${range}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecasts');
      }

      const data = await response.json();
      setForecasts(data.forecasts);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const generateTodaysForecast = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/forecasts/generate', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.needsBirthChart) {
          alert('Please create your birth chart first to generate forecasts.');
          return;
        }
        throw new Error(data.error || 'Failed to generate forecast');
      }

      const data = await response.json();
      
      // Remove existing forecast with same ID to prevent duplicates
      const updatedForecasts = forecasts.filter(f => f.id !== data.forecast.id);
      setForecasts([data.forecast, ...updatedForecasts]);
      setSelectedForecast(data.forecast);
      setGenerating(false);
    } catch (err) {
      console.error('Error generating forecast:', err);
      alert(err.message);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading your forecasts...</p>
        </div>
      </div>
    );
  }

  if (selectedForecast) {
    return <ForecastDetail forecast={selectedForecast} onBack={() => setSelectedForecast(null)} />;
  }

  // Check if today's forecast exists
  const today = new Date().toISOString().split('T')[0];
  const todaysForecast = forecasts.find(f => f.forecast_date === today && f.forecast_type === 'daily');

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-semibold text-white tracking-tight">
                    Your Forecasts
                  </h1>
                  <p className="text-purple-300 mt-1">Personalized cosmic guidance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/forecasts/settings"
                className="text-purple-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <Settings className="w-6 h-6" />
              </Link>
              <Link href="/dashboard" className="text-purple-300 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* Generate Today's Forecast */}
          {!todaysForecast && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-2xl rounded-3xl border border-purple-500/30 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Generate Today&apos;s Forecast
                  </h3>
                  <p className="text-purple-200">
                    Get your personalized guidance for today based on current transits
                  </p>
                </div>
                <button
                  onClick={generateTodaysForecast}
                  disabled={generating}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50 disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Range Selector */}
          <div className="flex gap-3">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  range === r
                    ? 'bg-white text-black shadow-lg shadow-white/25'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Forecasts List */}
        {forecasts.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No forecasts yet</h3>
            <p className="text-purple-300 mb-6">Generate your first forecast to get started</p>
            <button
              onClick={generateTodaysForecast}
              disabled={generating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50"
            >
              Generate Today&apos;s Forecast
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {forecasts.map((forecast) => (
              <ForecastCard
                key={forecast.id}
                forecast={forecast}
                onClick={() => setSelectedForecast(forecast)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastCard({ forecast, onClick }) {
  const urgencyColors = {
    low: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    normal: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    high: 'from-red-500/20 to-orange-500/20 border-red-500/30',
  };

  const urgencyIcons = {
    low: '🕊️',
    normal: '🌟',
    high: '⚡',
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-r ${urgencyColors[forecast.urgency]} backdrop-blur-2xl rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{urgencyIcons[forecast.urgency]}</span>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-bold text-white">
                  {forecast.headline}
                </h4>
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 text-white">
                  {forecast.forecast_type}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-1">
                {formatDate(forecast.forecast_date)}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            forecast.urgency === 'high' ? 'bg-red-500/30 text-red-200' :
            forecast.urgency === 'normal' ? 'bg-purple-500/30 text-purple-200' :
            'bg-blue-500/30 text-blue-200'
          }`}>
            {forecast.urgency}
          </div>
        </div>
      </div>

      <p className="text-white/80 mb-4 line-clamp-2">{forecast.theme}</p>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-white/60" />
          <span className="text-white/80">
            {Array.isArray(forecast.transit_summary) ? forecast.transit_summary.length : 0} transits
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/60" />
          <span className="text-white/80">
            {Array.isArray(forecast.suggested_actions) ? forecast.suggested_actions.length : 0} actions
          </span>
        </div>
        {forecast.topics && (
          <div className="flex gap-2">
            {forecast.topics.slice(0, 3).map((topic, idx) => (
              <span key={idx} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastDetail({ forecast, onBack }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forecasts
        </button>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {forecast.headline}
              </h1>
              <p className="text-white/80 text-lg">
                {new Date(forecast.forecast_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              forecast.urgency === 'high' ? 'bg-red-500/30 text-white' :
              forecast.urgency === 'normal' ? 'bg-purple-500/30 text-white' :
              'bg-blue-500/30 text-white'
            }`}>
              {forecast.urgency} urgency
            </div>
          </div>
          <p className="text-2xl text-white/90">{forecast.theme}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Full Guidance</h2>
          <div className="text-white/80 text-lg leading-relaxed whitespace-pre-line">
            {forecast.full_text}
          </div>
        </div>

        {forecast.suggested_actions && forecast.suggested_actions.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Suggested Actions
            </h3>
            <div className="space-y-3">
              {forecast.suggested_actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-semibold text-sm">{idx + 1}</span>
                  </div>
                  <p className="text-white/90">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {forecast.transit_summary && forecast.transit_summary.length > 0 && (
          <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Active Transits</h3>
            <div className="space-y-3">
              {forecast.transit_summary.map((transit, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {transit.strength === 'high' ? '⚡' : transit.strength === 'medium' ? '🌟' : '✨'}
                    </span>
                    <div>
                      <p className="text-white font-medium">
                        {transit.planet} {transit.aspect} {transit.to}
                      </p>
                      <p className="text-white/60 text-sm">
                        {transit.topic} • orb: {transit.orb?.toFixed(1)}°
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    transit.strength === 'high' ? 'bg-red-500/30 text-red-200' :
                    transit.strength === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                    'bg-blue-500/30 text-blue-200'
                  }`}>
                    {transit.strength}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

