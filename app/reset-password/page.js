"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setStep('reset');
    }
  }, [searchParams]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setFormData({ ...formData, email: "" });
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token, 
          password: formData.password 
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block float-animation">
            <img src="/logo.png" alt="Cosmic Spiritual Guide" className="w-20 h-20 mx-auto mb-4 object-contain" />
          </div>
          <h1 className="text-3xl font-semibold gradient-text mb-2">
            {step === 'request' ? '🔮 Find Your Way Back' : '✨ Restore Your Path'}
          </h1>
          <p className="text-gray-600">
            {step === 'request' 
              ? 'The cosmic forces will guide you back to your spiritual sanctuary'
              : 'Enter your new password to restore your spiritual journey'
            }
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
                placeholder="Enter your cosmic email"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending Cosmic Guidance...
                </span>
              ) : (
                "🌟 Send Reset Link 🌟"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium smooth-transition"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
                placeholder="Enter your new cosmic password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
                placeholder="Confirm your new cosmic password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
                <div className="mt-2 text-sm">
                  Redirecting to login in a few moments...
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Restoring Your Path...
                </span>
              ) : (
                "✨ Restore My Spiritual Sanctuary ✨"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium smooth-transition"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>🔮 Cosmic Wisdom:</strong>
            </p>
            <p className="text-xs text-gray-500">
              {step === 'request' 
                ? 'The universe will send you a mystical link to restore your spiritual path. Check your email for cosmic guidance.'
                : 'Your new password will be blessed by the cosmic forces and guide you back to your spiritual sanctuary.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 w-full max-w-md">
          <div className="text-center">
            <div className="inline-block float-animation">
              <img src="/logo.png" alt="Cosmic Spiritual Guide" className="w-20 h-20 mx-auto mb-4 object-contain" />
            </div>
            <h1 className="text-3xl font-semibold gradient-text mb-2">🔮 Loading Cosmic Guidance...</h1>
            <div className="flex items-center justify-center mt-4">
              <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
