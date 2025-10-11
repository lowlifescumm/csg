"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const CreditManagementWidget = () => {
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      
      if (response.ok) {
        setCreditData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch credit data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatHistoryDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCreditTypeIcon = (type) => {
    switch(type) {
      case 'moon_reading':
        return '🌙';
      case 'birth_chart':
        return '⭐';
      case 'compatibility':
        return '💕';
      default:
        return '✨';
    }
  };

  const getCreditTypeLabel = (type) => {
    switch(type) {
      case 'moon_reading':
        return 'Moon Reading';
      case 'birth_chart':
        return 'Birth Chart';
      case 'compatibility':
        return 'Compatibility';
      default:
        return type;
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 75) return 'from-green-400 to-emerald-500';
    if (percentage >= 40) return 'from-yellow-400 to-amber-500';
    return 'from-red-400 to-rose-500';
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 animate-pulse">
        <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded-xl w-48 mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gradient-to-r from-gray-300 to-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gradient-to-r from-gray-300 to-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!creditData) {
    return null;
  }

  // Premium User View
  if (creditData.isPremium) {
    const { credits, history, stats } = creditData;
    
    return (
      <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 relative overflow-hidden">
        {/* Background gradient decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold gradient-text">Credit Management</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold">
              <span>👑</span>
              <span>Premium</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-40 rounded-2xl p-4 border border-white border-opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Available</p>
                  <p className="text-3xl font-bold gradient-text">{stats.totalAvailable}</p>
                  <p className="text-xs text-gray-500 mt-1">of {stats.monthlyAllocation} monthly</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                  ✨
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-40 rounded-2xl p-4 border border-white border-opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Used This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsedThisMonth}</p>
                  <p className="text-xs text-gray-500 mt-1">readings completed</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl">
                  📊
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-40 rounded-2xl p-4 border border-white border-opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Renewal In</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.daysUntilRenewal}</p>
                  <p className="text-xs text-gray-500 mt-1">days</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white text-2xl animate-pulse">
                  🔄
                </div>
              </div>
            </div>
          </div>

          {/* Credit Breakdown */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Credit Breakdown</h3>
            {Object.entries(credits).map(([type, data]) => {
              const percentage = (data.remaining / data.total) * 100;
              const progressColor = getProgressBarColor(percentage);
              const statusColor = getStatusColor(percentage);
              
              return (
                <div key={type} className="bg-white bg-opacity-40 rounded-2xl p-4 border border-white border-opacity-60 smooth-transition hover:bg-opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCreditTypeIcon(type)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{getCreditTypeLabel(type)}</p>
                        <p className={`text-sm font-semibold ${statusColor}`}>
                          {data.remaining}/{data.total} credits remaining
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Resets</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(data.resetDate)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${progressColor} smooth-transition rounded-full`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="h-full bg-white bg-opacity-30 animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Usage History */}
          {history && history.length > 0 && (
            <div className="bg-white bg-opacity-30 rounded-2xl p-5 border border-white border-opacity-60">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Credit Usage</h3>
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 border-opacity-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCreditTypeIcon(item.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">{formatHistoryDate(item.date)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      -1 credit
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

  // Free User View
  return (
    <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-full opacity-10 blur-3xl -mr-32 -mt-32"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold gradient-text">Unlock Premium Credits</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
            <span>🌟</span>
            <span>Free Plan</span>
          </div>
        </div>

        {/* Teaser Content */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4 animate-pulse">
              <span className="text-4xl">👑</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
            <p className="text-gray-600">Get 8 monthly credits to explore your cosmic journey!</p>
          </div>

          {/* What's Included */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white bg-opacity-70 rounded-xl p-4 text-center">
              <span className="text-3xl mb-2 block">🌙</span>
              <p className="font-semibold text-gray-900">4 Moon Readings</p>
              <p className="text-sm text-gray-600">Monthly lunar insights</p>
            </div>
            <div className="bg-white bg-opacity-70 rounded-xl p-4 text-center">
              <span className="text-3xl mb-2 block">⭐</span>
              <p className="font-semibold text-gray-900">2 Birth Charts</p>
              <p className="text-sm text-gray-600">Detailed natal analysis</p>
            </div>
            <div className="bg-white bg-opacity-70 rounded-xl p-4 text-center">
              <span className="text-3xl mb-2 block">💕</span>
              <p className="font-semibold text-gray-900">2 Compatibility</p>
              <p className="text-sm text-gray-600">Relationship insights</p>
            </div>
          </div>

          {/* Benefits List */}
          <div className="bg-white bg-opacity-50 rounded-xl p-4 mb-6">
            <p className="font-semibold text-gray-900 mb-3">Premium Benefits:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Credits refresh automatically every month</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Access to exclusive Transit Dashboard</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority support and new features</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <Link
            href="/subscription"
            className="block w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg text-center"
          >
            🚀 Unlock 8 Monthly Credits
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Join thousands of premium members exploring their cosmic path</p>
          <p className="mt-1 font-semibold">✨ Only $9.99/month ✨</p>
        </div>
      </div>
    </div>
  );
};

export default CreditManagementWidget;