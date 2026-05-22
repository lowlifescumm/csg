"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";
import BirthChartForm from "@/components/BirthChartForm";

function BirthChartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const updateMode = searchParams?.get('update') === 'true';
  const redirect = searchParams?.get('redirect') || null;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const loading = authLoading || (!!user && !updateMode && chartLoading);

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
      <BirthChartForm updateMode={updateMode} user={user} redirect={redirect} />
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
