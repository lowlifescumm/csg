"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [claimingReading, setClaimingReading] = useState(false);

  // Check for pending reading claim
  const pendingReadingId = typeof window !== 'undefined' 
    ? sessionStorage.getItem('pending_reading_claim') 
    : null;
  const redirectTo = searchParams.get('redirect');
  const action = searchParams.get('action');

  // Ensure component is mounted before using NextAuth functions (important for mobile)
  useEffect(() => {
    setMounted(true);
    
    // Check for error in URL query parameters (from NextAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (errorParam === 'google') {
        errorMessage = 'Google sign-in failed. Please check that Google OAuth is properly configured.';
      } else if (errorParam === 'Configuration') {
        errorMessage = 'Authentication configuration error. Please contact support.';
      } else if (errorParam === 'AccessDenied') {
        errorMessage = 'Access denied. Please try again or use email/password.';
      } else if (errorParam === 'Verification') {
        errorMessage = 'Verification failed. Please try again.';
      }
      setError(errorMessage);
    }
  }, []);

  // Handle claiming pending reading after successful auth
  const claimPendingReading = async () => {
    const readingId = sessionStorage.getItem('pending_reading_claim');
    if (!readingId) return;
    
    setClaimingReading(true);
    try {
      const response = await fetch('/api/free-tarot/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear pending reading
        sessionStorage.removeItem('pending_reading_claim');
        localStorage.removeItem('csg_free_reading_used');
        localStorage.removeItem('csg_free_reading_data');
        
        // Show success and redirect
        alert('Your free reading has been saved to your account!');
      }
    } catch (err) {
      console.error('Error claiming reading:', err);
    } finally {
      setClaimingReading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Wait for component to mount and SessionProvider to be ready
    if (!mounted) {
      setError("Please wait, initializing...");
      return;
    }

    setGoogleLoading(true);
    setError("");
    
    // Use public origin to ensure we hit the correct domain
    const callbackUrl = `${window.location.origin}/dashboard`;
    
    console.log('[Login] Initiating Google sign-in with callbackUrl:', callbackUrl);
    
    // Let NextAuth handle the redirect - this will navigate to Google OAuth
    // The redirect: true (default) will cause a full page navigation to Google
    signIn("google", {
      callbackUrl: callbackUrl,
      redirect: true  // Explicitly enable redirect to prevent cancelled requests
    });
    
    // Note: We don't set loading to false here because the page will redirect
    // If the redirect fails, NextAuth will redirect back with an error parameter
    // which is handled by the useEffect hook above
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Clear any existing errors
        setError("");
        
        // Claim pending reading if exists
        await claimPendingReading();
        
        // Small delay to ensure cookie is set (especially important on mobile)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to dashboard or specified redirect
        const redirectPath = redirectTo ? `/${redirectTo}` : "/dashboard";
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Login/signup error:", err);
      setError("Failed to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render until mounted (prevents hydration mismatches on mobile)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 w-full max-w-md">
          <div className="text-center">
            <div className="inline-block float-animation">
              <div className="flex flex-col items-center mb-4">
                <img src="/logo-eye.svg" alt="Cosmic Spirit Guide" className="w-20 h-20 mx-auto mb-2 object-contain" />
                <img src="/logo-text.svg" alt="Cosmic Spirit Guide" className="h-8 object-contain" />
              </div>
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block float-animation">
            <img src="/logo.png" alt="Cosmic Spirit Guide" className="w-20 h-20 mx-auto mb-4 object-contain" />
          </div>
          <h1 className="text-3xl font-semibold gradient-text mb-2">Cosmic Spirit Guide</h1>
          
          {pendingReadingId ? (
            <p className="text-gray-600">
              Create an account to save your free tarot reading!
            </p>
          ) : (
            <p className="text-gray-600">Welcome back to your spiritual journey</p>
          )}
        </div>

        <div className="flex gap-2 mb-8 bg-gray-100 bg-opacity-50 rounded-2xl p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl font-medium smooth-transition ${
              isLogin
                ? "bg-white text-purple-600 apple-shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl font-medium smooth-transition ${
              !isLogin
                ? "bg-white text-purple-600 apple-shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
                  required={!isLogin}
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
                  required={!isLogin}
                  placeholder="Last name"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition text-gray-900 bg-white bg-opacity-70"
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {isLogin && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => router.push('/reset-password')}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium smooth-transition"
                >
                  🔮 Forgot your cosmic password?
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || claimingReading}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow-lg"
          >
            {loading || claimingReading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {claimingReading ? 'Saving your reading...' : (isLogin ? "Logging in..." : "Signing up...")}
              </span>
            ) : (
              isLogin ? "Log In" : "Sign Up"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white bg-opacity-80 text-gray-500 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-semibold smooth-transition hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow border border-gray-200 flex items-center justify-center gap-3"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Connecting to Google...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign {isLogin ? 'in' : 'up'} with Google
            </>
          )}
        </button>

        {pendingReadingId && (
          <div className="mt-6 text-center">
            <Link href="/free-tarot" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              ← Back to my reading
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
