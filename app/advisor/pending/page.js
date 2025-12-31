"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdvisorPendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      // Check authentication
      const authRes = await fetch("/api/auth/user");
      const authData = await authRes.json();
      
      if (!authData.user) {
        router.push("/login");
        return;
      }

      // Fetch advisor profile
      const profileRes = await fetch("/api/marketplace/advisors/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          const profileStatus = profileData.data.status;
          setProfile(profileData.data);

          // Redirect if already approved or rejected
          if (profileStatus === 'APPROVED') {
            router.push("/dashboard");
            return;
          } else if (profileStatus === 'REJECTED') {
            // Could redirect to a rejection page in the future
            // For now, just show the pending page with rejection message
          }
        } else {
          // No profile exists, redirect to onboarding
          router.push("/advisor/onboarding");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking profile status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-purple-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
    );
  }

  const status = profile?.status || 'PENDING';
  const isRejected = status === 'REJECTED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 smooth-transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40">
          <div className="text-center mb-8">
            {/* Status Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 smooth-transition">
              {isRejected ? (
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              {isRejected ? "Application Rejected" : "Application Under Review"}
            </h1>
            <p className="text-lg text-gray-600">
              {isRejected 
                ? "Your advisor application has been reviewed and unfortunately was not approved at this time."
                : "Thank you for submitting your advisor application! Our team is reviewing your profile."
              }
            </p>
          </div>

          {/* Status Card */}
          <div className={`mb-8 px-6 py-5 rounded-xl border-2 ${
            isRejected
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${
                  isRejected ? "text-red-800" : "text-yellow-800"
                }`}>
                  Current Status
                </p>
                <p className={`text-2xl font-bold ${
                  isRejected ? "text-red-900" : "text-yellow-900"
                }`}>
                  {status}
                </p>
              </div>
              {!isRejected && (
                <div className="text-right">
                  <p className="text-sm text-yellow-700">
                    Waiting for admin review
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="space-y-4 mb-8">
            <div className="bg-white bg-opacity-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {isRejected ? "What's Next?" : "What Happens Next?"}
              </h2>
              {isRejected ? (
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Your application did not meet our current requirements.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>You can update your profile and resubmit for review.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>If you have questions, please contact our support team.</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Our admin team will review your profile, bio, specialties, and rate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Review typically takes 24-48 hours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>You'll be notified once a decision has been made.</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {isRejected ? (
              <>
                <Link
                  href="/advisor/onboarding"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-center smooth-transition hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  Update Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-center smooth-transition hover:bg-gray-50"
                >
                  Back to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/advisor/onboarding"
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-center smooth-transition hover:bg-gray-50"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-center smooth-transition hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  Back to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

