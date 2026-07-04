"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";
import BirthChartForm from "@/components/BirthChartForm";
import LowCreditsUpsellBanner from "@/components/LowCreditsUpsellBanner";
import FloatingUpgradePrompt from "@/components/FloatingUpgradePrompt";

function BirthChartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const updateMode = searchParams?.get('update') === 'true';
  const redirect = searchParams?.get('redirect') || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show floating prompt 30 seconds after banner is dismissed
  useEffect(() => {
    if (bannerDismissed) {
      const timer = setTimeout(() => {
        setShowFloatingPrompt(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [bannerDismissed]);

  const { loading: authLoading } = useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/auth/user'),
    [],
    {
      onErrorWithToast: () => false,
      onSuccess: (data) => {
        if (data.user) setUser(data.user);
      },
    },
  );

  const { loading: chartLoading } = useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/birth-chart'),
    [user],
    {
      enabled: !!user && !updateMode,
      onErrorWithToast: () => false,
      onSuccess: (data) => {
        if (data.hasChart) {
          router.push('/my-chart');
        }
      },
    },
  );

  // Check credits for premium report purchases
  useApiClientWithToast(
    apiClient,
    (c) => c.get('/api/credits'),
    [],
    {
      enabled: !!user,
      onSuccess: (creditData) => {
        if (creditData.isPremium) {
          setIsPremium(true);
          setCreditsRemaining(creditData.credits?.report?.remaining || 0);
        } else {
          setIsPremium(false);
          setCreditsRemaining(0);
        }
      },
      onErrorWithToast: () => {
        setIsPremium(false);
        setCreditsRemaining(0);
        return false;
      },
    },
  );

  const loading = authLoading || (!!user && !updateMode && chartLoading);

  // Admin bypass - no gates shown
  const isAdmin = user?.role === 'admin';
  const showCreditGate = isPremium && !isAdmin && creditsRemaining !== null && creditsRemaining < 1;

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-200 animate-pulse mb-4">Loading your cosmic journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      {/* Show upsell banner for premium users with no report credits */}
      {showCreditGate && (
        <LowCreditsUpsellBanner
          currentCredits={creditsRemaining}
          creditsNeeded={1}
          creditType="report"
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Show floating prompt when triggered */}
      {showFloatingPrompt && (
        <FloatingUpgradePrompt
          message={
            creditsRemaining === 0
              ? "No report credits remaining! Upgrade to Premium to generate PDF reports"
              : "Premium PDF reports require credits"
          }
        />
      )}

      <div className="relative overflow-hidden py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            Free Birth Chart Calculator
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Discover your cosmic blueprint based on your birth date, time, and location
          </p>
        </div>
      </div>
      <BirthChartForm updateMode={updateMode} user={user} redirect={redirect} creditsRemaining={creditsRemaining} isPremium={isPremium} />
    </div>
  );
}

export default function BirthChartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-200 animate-pulse mb-4">Loading...</p>
        </div>
      </div>
    }>
      <BirthChartPageInner />
    </Suspense>
  );
}
