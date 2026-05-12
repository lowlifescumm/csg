const logger = require('../lib/logger');
'use client';

export const dynamic = 'force-static';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Zap, Star, Heart, TrendingUp, Check } from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/user');
      const data = await res.json();
      
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSubscribe = async (tierId = 'MYSTIC_LITE') => {
    setProcessing(true);
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to create subscription');
        setProcessing(false);
      }
    } catch (error) {
      logger.error('Subscription error:', error);
      alert('Failed to start subscription process');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-300 animate-spin" />
      </div>
    );
  }

  const isPremium = user?.stripeSubscriptionId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            {isPremium ? 'Premium Member' : 'Upgrade to Premium'}
          </h1>
          <p className="text-xl text-purple-200">
            {isPremium ? 'You have full access to all features' : 'Unlock unlimited cosmic guidance'}
          </p>
        </div>

        {isPremium ? (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Active Subscription</h2>
            <p className="text-purple-200 mb-8">You&apos;re enjoying all premium features!</p>
            <Link
              href="/dashboard"
              className="inline-block bg-white bg-opacity-20 text-white font-bold py-4 px-8 rounded-lg hover:bg-opacity-30 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Mystic Lite */}
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Mystic Lite</h2>
                  <div className="text-5xl font-bold text-white mb-2">$19.99</div>
                  <div className="text-xl text-purple-200">per month</div>
                  <div className="text-lg text-white mt-2">60 credits/month</div>
                  <div className="text-sm text-purple-200 mt-1">90-day rollover</div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">Access to all reading types</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">Standard support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">5% discount on reports</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe('MYSTIC_LITE')}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {processing ? 'Processing...' : `Subscribe Now - $19.99/month`}
                </button>
              </div>

              {/* Mystic Premium */}
              <div className="bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-orange-600/30 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-yellow-400/50 relative">
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    Best Value
                  </span>
                </div>
                
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Mystic Premium</h2>
                  <div className="text-5xl font-bold text-white mb-2">$39.99</div>
                  <div className="text-xl text-purple-200">per month</div>
                  <div className="text-lg text-white mt-2">150 credits/month</div>
                  <div className="text-sm text-purple-200 mt-1">180-day rollover</div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">Access to all reading types</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">Priority queue</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">10% discount on reports</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">Seasonal premium readings</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200 text-sm">Extended forecasts & timelines</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe('MYSTIC_PREMIUM')}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {processing ? 'Processing...' : `Subscribe Now - $39.99/month`}
                </button>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/dashboard"
                className="text-purple-300 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
