'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Zap, Star, Heart, TrendingUp, Check } from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to create subscription');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
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
            <p className="text-purple-200 mb-8">You're enjoying all premium features!</p>
            <Link
              href="/dashboard"
              className="inline-block bg-white bg-opacity-20 text-white font-bold py-4 px-8 rounded-lg hover:bg-opacity-30 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-20 mb-8">
              <div className="text-center mb-8">
                <div className="text-7xl font-bold text-white mb-2">$9.99</div>
                <div className="text-xl text-purple-200">per month</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      ⚡ Unlimited Transit Dashboard
                    </h3>
                    <p className="text-purple-200">Track active planetary transits affecting your birth chart with AI-powered interpretations</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      🌙 4 Moon Reading Credits/Month
                    </h3>
                    <p className="text-purple-200">Get personalized lunar guidance for all major moon phases</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      💕 2 Compatibility Report Credits/Month
                    </h3>
                    <p className="text-purple-200">Analyze relationships with detailed astrological compatibility insights</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      ⭐ 2 Birth Chart Credits/Month
                    </h3>
                    <p className="text-purple-200">Create detailed natal charts with downloadable visualizations</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      🔮 Unlimited Tarot Readings
                    </h3>
                    <p className="text-purple-200">No credit limits - read as much as you want</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      ⭐ Priority AI Interpretations
                    </h3>
                    <p className="text-purple-200">Enhanced personalized guidance powered by GPT-4o-mini</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={processing}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-5 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl text-lg flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Subscribe Now
                  </>
                )}
              </button>

              <p className="text-center text-purple-300 text-sm mt-4">
                Secure payment powered by Stripe • Cancel anytime
              </p>
            </div>

            <div className="text-center">
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
