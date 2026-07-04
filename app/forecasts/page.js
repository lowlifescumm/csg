'use client';

export const dynamic = 'force-static';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useApiClientWithToast } from '@/src/hooks/useApiClientWithToast';
import { useToast } from '@/components/ui';
import { 
  Calendar, Star, Sparkles, TrendingUp, AlertTriangle, 
  Clock, Target, ArrowLeft, Loader2, Plus, Settings
} from 'lucide-react';
import Link from 'next/link';
import LowCreditsUpsellBanner from '@/components/LowCreditsUpsellBanner';
import FloatingUpgradePrompt from '@/components/FloatingUpgradePrompt';

function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function formatForecastDateRange(forecast, opts = { month: 'short', day: 'numeric' }) {
  if (forecast.forecast_type === 'weekly' && forecast.day_breakdown?.length > 0) {
    const start = parseLocalDate(forecast.day_breakdown[0]?.date);
    const end = parseLocalDate(forecast.day_breakdown[forecast.day_breakdown.length - 1]?.date);
    if (start && end) {
      const year = start.getFullYear() === end.getFullYear()
        ? `, ${start.getFullYear()}`
        : ` – ${end.getFullYear()}`;
      return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}${year}`;
    }
  }
  return null;
}

export default function ForecastsPage() {
  const toast = useToast();
  const [forecasts, setForecasts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [range, setRange] = useState('7d');
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [user, setUser] = useState(null);

  const { loading } = useApiClientWithToast(
    apiClient,
    (c) => c.get(`/api/forecasts?range=${range}`),
    [range],
    {
      onSuccess: (data) => {
        setForecasts(data.forecasts);
      },
      toastMessages: { error: "Failed to load forecasts." },
    },
  );

  // Check credits and user data for gating
  useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/credits'),
    [],
    {
      onSuccess: (creditData) => {
        if (creditData.isPremium) {
          setIsPremium(true);
          setCreditsRemaining(creditData.credits?.forecast?.remaining || 0);
        } else {
          setIsPremium(false);
          setCreditsRemaining(0);
        }
      },
      onErrorWithToast: () => {
        setIsPremium(false);
        setCreditsRemaining(0);
        return false;
      },
    },
  );

  useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/auth/user'),
    [],
    {
      onSuccess: (data) => {
        if (data.user) setUser(data.user);
      },
      onErrorWithToast: () => false,
    },
  );

  // Show floating prompt 30 seconds after banner is dismissed
  useEffect(() => {
    if (bannerDismissed) {
      const timer = setTimeout(() => {
        setShowFloatingPrompt(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [bannerDismissed]);

  const generateTodaysForecast = async () => {
    // Credit gate: Check credits BEFORE generating forecast
    // Requires 8 credits for forecasts
    const isAdmin = user?.role === 'admin';
    if (!isAdmin && isPremium && creditsRemaining !== null && creditsRemaining < 8) {
      toast.error(`Insufficient credits. Forecasts require 8 credits. You have ${creditsRemaining} remaining.`);
      setShowFloatingPrompt(true);
      return;
    }

    try {
      setGenerating(true);
      const data = await apiClient.post('/api/forecasts/generate');

      const updatedForecasts = forecasts.filter(f => f.id !== data.forecast.id);
      setForecasts([data.forecast, ...updatedForecasts]);
      setSelectedForecast(data.forecast);
      setGenerating(false);
    } catch (err) {
      if (err.status === 400 && err.message?.includes('natal chart')) {
        toast.error('Please create your birth chart first to generate forecasts.');
        setGenerating(false);
        return;
      }
      console.error('Error generating forecast:', err);
      toast.error(err.message || 'Failed to generate forecast.');
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

  // Admin bypass - no gates shown
  const isAdmin = user?.role === 'admin';
  const showCreditGate = isPremium && !isAdmin && creditsRemaining !== null && creditsRemaining < 8;

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />

      {/* Show upsell banner when credits are insufficient (requires 8 credits) */}
      {showCreditGate && !bannerDismissed && (
        <LowCreditsUpsellBanner
          currentCredits={creditsRemaining}
          creditsNeeded={8}
          creditType="forecast"
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Show floating prompt when credits insufficient */}
      {showFloatingPrompt && (
        <FloatingUpgradePrompt
          message={`Forecasts require 8 credits. You have ${creditsRemaining} remaining.`}
          duration={7000}
        />
      )}

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
    const date = parseLocalDate(dateStr);
    if (!date) return dateStr;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const displayDate = formatForecastDateRange(forecast) || formatDate(forecast.forecast_date);

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
                {displayDate}
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
                {formatForecastDateRange(forecast, { month: 'long', day: 'numeric' })
                  || (() => {
                    const date = parseLocalDate(forecast.forecast_date);
                    return date
                      ? date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : forecast.forecast_date;
                  })()}
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

        {forecast.forecast_type === 'weekly' && forecast.day_breakdown && forecast.day_breakdown.length > 0 && (
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Day-by-Day Breakdown</h2>
            <div className="space-y-6">
              {forecast.day_breakdown.map((day, idx) => (
                <div key={idx} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{day.day}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      day.urgency === 'high' ? 'bg-red-500/30 text-red-200' :
                      day.urgency === 'normal' ? 'bg-purple-500/30 text-purple-200' :
                      'bg-blue-500/30 text-blue-200'
                    }`}>
                      {day.urgency}
                    </span>
                  </div>
                  <p className="text-white/90 font-medium mb-2">{day.headline}</p>
                  <p className="text-white/70 mb-4">{day.theme}</p>
                  {day.transitSummary && day.transitSummary.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/60 text-sm mb-2">Key Transits:</p>
                      <div className="flex flex-wrap gap-2">
                        {day.transitSummary.map((t, tIdx) => (
                          <span key={tIdx} className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs">
                            {t.planet} {t.aspect} {t.to}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {day.suggestedActions && day.suggestedActions.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm mb-2">Suggested Actions:</p>
                      <ul className="space-y-1">
                        {day.suggestedActions.map((action, aIdx) => (
                          <li key={aIdx} className="text-white/80 text-sm flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

