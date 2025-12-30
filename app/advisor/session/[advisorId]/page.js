"use client";
import { useParams, useSearchParams } from "next/navigation";
import { Phone, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";

function AdvisorSessionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const advisorId = params?.advisorId;
  const sessionType = searchParams?.get('type'); // 'call' or 'chat'
  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState(null);

  useEffect(() => {
    if (advisorId) {
      // Fetch advisor details (for display)
      // Note: This is a placeholder - full session functionality will be implemented later
      fetchAdvisorDetails();
    }
  }, [advisorId]);

  const fetchAdvisorDetails = async () => {
    try {
      const response = await fetch(`/api/marketplace/advisors`);
      const data = await response.json();
      
      if (data.success && data.data?.advisors) {
        const foundAdvisor = data.data.advisors.find(a => a.id.toString() === advisorId.toString());
        setAdvisor(foundAdvisor);
      }
    } catch (err) {
      console.error("Error fetching advisor:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  const isCall = sessionType === 'call';
  const sessionTypeLabel = isCall ? 'Call' : 'Chat';
  const SessionIcon = isCall ? Phone : MessageCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 smooth-transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </Link>

        {/* Coming Soon Message */}
        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 bg-white bg-opacity-70 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <SessionIcon className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {sessionTypeLabel} Session Coming Soon
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            The {sessionTypeLabel.toLowerCase()} session feature is currently under development.
          </p>

          {advisor && (
            <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {advisor.name}
              </h2>
              {advisor.rate_display && (
                <p className="text-gray-600">{advisor.rate_display}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-600">
              We're working hard to bring you live {sessionTypeLabel.toLowerCase()} sessions with our advisors.
              Check back soon!
            </p>

            <Link
              href="/marketplace"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-8 rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg"
            >
              Browse Other Advisors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdvisorSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    }>
      <AdvisorSessionContent />
    </Suspense>
  );
}

