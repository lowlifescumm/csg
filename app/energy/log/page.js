"use client";
const logger = require('../../../lib/logger');
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

export default function EnergyLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    physical: 75,
    emotional: 75,
    spiritual: 75,
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          physical: parseInt(formData.physical),
          emotional: parseInt(formData.emotional),
          spiritual: parseInt(formData.spiritual),
          date: formData.date,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError(data.error || "Failed to log energy");
      }
    } catch (err) {
      logger.error("Error logging energy:", err);
      setError("Failed to log energy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: parseInt(value),
    }));
  };

  const getEnergyColor = (value) => {
    if (value >= 80) return "text-green-400";
    if (value >= 60) return "text-yellow-400";
    if (value >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getEnergyLabel = (value) => {
    if (value >= 80) return "High";
    if (value >= 60) return "Good";
    if (value >= 40) return "Moderate";
    return "Low";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white smooth-transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/50">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Log Your Energy</h1>
              <p className="text-purple-300 text-lg">Track your physical, emotional, and spiritual energy</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center gap-3">
            <Zap className="w-5 h-5 text-green-400" />
            <p className="text-green-200">Energy logged successfully! Redirecting to dashboard...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40">
          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Physical Energy */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <label className="text-white font-semibold">Physical Energy</label>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getEnergyColor(formData.physical)}`}>
                  {formData.physical}%
                </span>
                <p className="text-xs text-purple-200">{getEnergyLabel(formData.physical)}</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.physical}
              onChange={(e) => handleSliderChange("physical", e.target.value)}
              className="w-full h-3 bg-white bg-opacity-10 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${formData.physical}%, rgba(255,255,255,0.1) ${formData.physical}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-purple-200 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Emotional Energy */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <label className="text-white font-semibold">Emotional Energy</label>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getEnergyColor(formData.emotional)}`}>
                  {formData.emotional}%
                </span>
                <p className="text-xs text-purple-200">{getEnergyLabel(formData.emotional)}</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.emotional}
              onChange={(e) => handleSliderChange("emotional", e.target.value)}
              className="w-full h-3 bg-white bg-opacity-10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${formData.emotional}%, rgba(255,255,255,0.1) ${formData.emotional}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-purple-200 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Spiritual Energy */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <label className="text-white font-semibold">Spiritual Energy</label>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${getEnergyColor(formData.spiritual)}`}>
                  {formData.spiritual}%
                </span>
                <p className="text-xs text-purple-200">{getEnergyLabel(formData.spiritual)}</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.spiritual}
              onChange={(e) => handleSliderChange("spiritual", e.target.value)}
              className="w-full h-3 bg-white bg-opacity-10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${formData.spiritual}%, rgba(255,255,255,0.1) ${formData.spiritual}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-purple-200 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : success ? (
              <>
                <Zap className="w-5 h-5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                <span>Log Energy</span>
              </>
            )}
          </button>

          {/* Info Text */}
          <p className="text-center text-purple-200 text-sm mt-4">
            Log your energy daily to track patterns and see your weekly forecast
          </p>
        </form>
      </div>
    </div>
  );
}


