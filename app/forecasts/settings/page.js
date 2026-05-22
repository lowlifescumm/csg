'use client';
const logger = require('../../../lib/logger');

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

export default function ForecastSettingsPage() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/forecasts/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/forecasts/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
      setSaving(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-black to-fuchsia-950 opacity-90" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/forecasts"
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Forecasts
          </Link>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50 disabled:opacity-50 flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-8">Forecast Settings</h1>

          <div className="space-y-8">
            {/* Delivery Settings */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Delivery Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Cadence</label>
                  <select
                    value={preferences?.delivery_cadence || 'daily'}
                    onChange={(e) => setPreferences({...preferences, delivery_cadence: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">None (Manual only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Delivery Time</label>
                  <input
                    type="time"
                    value={preferences?.delivery_time || '08:00:00'}
                    onChange={(e) => setPreferences({...preferences, delivery_time: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Timezone</label>
                  <input
                    type="text"
                    value={preferences?.timezone || 'America/Los_Angeles'}
                    onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    placeholder="America/Los_Angeles"
                  />
                </div>
              </div>
            </div>

            {/* Content Preferences */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Content Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Tone</label>
                  <select
                    value={preferences?.tone || 'spiritual'}
                    onChange={(e) => setPreferences({...preferences, tone: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="spiritual">Spiritual & Mystical</option>
                    <option value="practical">Practical & Grounded</option>
                    <option value="concise">Concise & Brief</option>
                    <option value="detailed">Detailed & In-depth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Default Length</label>
                  <select
                    value={preferences?.default_length || 'medium'}
                    onChange={(e) => setPreferences({...preferences, default_length: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="short">Short (Quick read)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="long">Long (Comprehensive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Topics of Interest</label>
                  <div className="space-y-2">
                    {['general', 'love', 'career', 'health', 'spirituality'].map((topic) => (
                      <label key={topic} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences?.topics?.includes(topic) || false}
                          onChange={(e) => {
                            const topics = preferences?.topics || [];
                            if (e.target.checked) {
                              setPreferences({...preferences, topics: [...topics, topic]});
                            } else {
                              setPreferences({...preferences, topics: topics.filter(t => t !== topic)});
                            }
                          }}
                          className="w-5 h-5 rounded bg-white/10 border border-white/20 checked:bg-purple-500"
                        />
                        <span className="text-white capitalize">{topic}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="text-white">Include suggested actions</span>
                  <input
                    type="checkbox"
                    checked={preferences?.include_actions || false}
                    onChange={(e) => setPreferences({...preferences, include_actions: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border border-white/20 checked:bg-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="text-white">Include rituals & practices</span>
                  <input
                    type="checkbox"
                    checked={preferences?.include_rituals || false}
                    onChange={(e) => setPreferences({...preferences, include_rituals: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border border-white/20 checked:bg-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 cursor-pointer">
                  <div>
                    <span className="text-white font-medium">AI Personalization</span>
                    <p className="text-white/60 text-sm">Premium feature - Enhanced AI rewrites</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences?.ai_rewrite_enabled || false}
                    onChange={(e) => setPreferences({...preferences, ai_rewrite_enabled: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border border-white/20 checked:bg-purple-500"
                  />
                </label>
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="text-white">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={preferences?.email_enabled || false}
                    onChange={(e) => setPreferences({...preferences, email_enabled: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border border-white/20 checked:bg-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="text-white">Push notifications</span>
                  <input
                    type="checkbox"
                    checked={preferences?.push_enabled || false}
                    onChange={(e) => setPreferences({...preferences, push_enabled: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border border-white/20 checked:bg-purple-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



