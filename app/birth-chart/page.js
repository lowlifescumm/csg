const logger = require('../lib/logger');
"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BirthChartForm from "@/components/BirthChartForm";

function BirthChartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingChart, setCheckingChart] = useState(true);
  const [mounted, setMounted] = useState(false);
  const updateMode = searchParams?.get('update') === 'true';

  useEffect(() => {
    setMounted(true);
    
    async function checkAuthAndChart() {
      try {
        // Check authentication (but don't require it)
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            
            // If update mode, skip chart check and show form
            if (updateMode) {
              setLoading(false);
              setCheckingChart(false);
              return;
            }
            
            // Check if user has a birth chart
            try {
              const chartRes = await fetch('/api/birth-chart');
              if (chartRes.ok) {
                const chartData = await chartRes.json();
                if (chartData.hasChart) {
                  // User has a chart, redirect to my-chart page
                  router.push('/my-chart');
                  return;
                }
              }
            } catch (chartError) {
              // Chart check failed, continue to show form
              logger.info('Chart check failed:', chartError);
            }
          }
        }
        // No user or no chart - show the form (no redirect to login)
      } catch (error) {
        logger.info('Auth check failed, showing form anyway:', error);
      } finally {
        setLoading(false);
        setCheckingChart(false);
      }
    }
    checkAuthAndChart();
  }, [router, updateMode]);

  if (!mounted) {
    return null;
  }

  if (loading || checkingChart) {
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

  // Show the form - user can be logged in or anonymous
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      {/* Page Header with H1 */}
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
      <BirthChartForm updateMode={updateMode} user={user} />
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
