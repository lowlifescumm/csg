'use client';

import { useState } from 'react';
import { X, Heart, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function PartnerDataForm({ isOpen, onClose, onComplete, reportType }) {
  const [step, setStep] = useState('choice'); // 'choice' | 'form'
  const [partnerData, setPartnerData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!partnerData.birthDate) newErrors.birthDate = 'Birth date is required';
    if (!partnerData.birthTime) newErrors.birthTime = 'Birth time is required';
    if (!partnerData.location.trim()) newErrors.location = 'Birth location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSkip = () => {
    onComplete({ skipPartnerData: true, partnerData: null });
    setStep('choice');
    setPartnerData({ name: '', birthDate: '', birthTime: '', location: '' });
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setLoading(true);
    // Small delay to show processing state
    setTimeout(() => {
      onComplete({
        skipPartnerData: false,
        partnerData: {
          name: partnerData.name || undefined,
          birthDate: partnerData.birthDate,
          birthTime: partnerData.birthTime,
          location: partnerData.location,
        },
      });
      setLoading(false);
      setStep('choice');
      setPartnerData({ name: '', birthDate: '', birthTime: '', location: '' });
      setErrors({});
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-pink-400" />
            <h2 className="text-xl font-bold text-white">
              {step === 'choice' ? 'Partner Compatibility' : 'Partner Birth Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'choice' ? (
            <div className="space-y-6">
              <div className="text-center">
                <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Include Partner Compatibility?
                </h3>
                <p className="text-purple-200 text-sm">
                  The {reportType?.toLowerCase() === 'master' ? 'Master' : 'Advanced'} Report can include a detailed compatibility analysis between you and your partner.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('form')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition"
                >
                  <Heart className="w-4 h-4" />
                  Yes, Add Partner Data
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full px-6 py-3 bg-white/10 text-purple-200 font-medium rounded-xl hover:bg-white/20 transition"
                >
                  Skip — Individual Report Only
                </button>
              </div>

              <p className="text-xs text-purple-300 text-center">
                You can also skip now and request a compatibility add-on later from your dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Partner Name <span className="text-purple-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={partnerData.name}
                  onChange={(e) => setPartnerData({ ...partnerData, name: e.target.value })}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Birth Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={partnerData.birthDate}
                  onChange={(e) => setPartnerData({ ...partnerData, birthDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
                />
                {errors.birthDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.birthDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Birth Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={partnerData.birthTime}
                  onChange={(e) => setPartnerData({ ...partnerData, birthTime: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
                />
                {errors.birthTime && (
                  <p className="text-red-400 text-xs mt-1">{errors.birthTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Birth Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={partnerData.location}
                  onChange={(e) => setPartnerData({ ...partnerData, location: e.target.value })}
                  placeholder="e.g. Los Angeles, California"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-pink-400"
                />
                {errors.location && (
                  <p className="text-red-400 text-xs mt-1">{errors.location}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('choice')}
                  className="flex-1 px-4 py-2 bg-white/10 text-purple-200 rounded-lg hover:bg-white/20 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
