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
        // Check authentication
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
              console.log('Chart check failed:', chartError);
            }
          } else {
            router.push('/login');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      } catch (error) {
        router.push('/login');
        return;
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

  if (!user) return null;

  // If we get here, user doesn't have a chart or is updating, show the form
  return <BirthChartForm updateMode={updateMode} />;
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
