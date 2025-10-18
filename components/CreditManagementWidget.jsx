"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const CreditManagementWidget = () => {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      
      if (response.ok && data.user) {
        setUserStats({
          credits: data.user.credits || 0,
          status: data.user.role === 'admin' ? 'Admin' : (data.user.subscription_status === 'active' ? 'Premium' : 'Free')
        });
      }
    } catch (err) {
      console.error('Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40 animate-pulse">
        <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-200 rounded-xl w-32 mb-4"></div>
        <div className="h-16 bg-gradient-to-r from-gray-300 to-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (!userStats) return null;

  // Premium User View - simplified
  if (userStats.status === 'Premium') {
    return (
      <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gradient-text">Premium Account</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold">
            <span>👑</span>
            <span>Premium</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-600 mb-2">You have unlimited access to all features</p>
          <Link
            href="/subscription"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            Manage Subscription
          </Link>
        </div>
      </div>
    );
  }

  // Free User View - simplified
  return (
    <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold gradient-text">Account Status</h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold">
          <span>🌟</span>
          <span>Free Plan</span>
        </div>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-gray-600 mb-2">Upgrade to Premium for unlimited access</p>
        <p className="text-sm text-gray-500 mb-4">✨ Only $9.99/month ✨</p>
        <Link
          href="/subscription"
          className="inline-block bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          🚀 Go Premium
        </Link>
      </div>
    </div>
  );
};

export default CreditManagementWidget;