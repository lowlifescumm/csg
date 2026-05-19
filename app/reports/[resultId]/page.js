'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import ReportViewer to avoid SSR issues
const ReportViewer = dynamic(() => import('@/components/ReportViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <span className="ml-3 text-gray-600">Loading report viewer...</span>
    </div>
  ),
});

function ReportViewContent() {
  const params = useParams();
  const resultId = params?.resultId;

  if (!resultId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-4">Report Not Found</h1>
          <p className="text-purple-200 mb-6">
            No report ID was provided. Please check your link and try again.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-purple-300 text-sm hidden sm:inline">
            Cosmic Spirit Guide Report
          </span>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          <ReportViewer resultId={resultId} autoDownload={false} />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .sticky {
            display: none !important;
          }
          .bg-gradient-to-b {
            background: white !important;
          }
          .bg-white\\/95 {
            background: white !important;
            box-shadow: none !important;
          }
          .max-w-5xl {
            max-width: none !important;
            padding: 0 !important;
          }
          .rounded-2xl {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading your report...</p>
          </div>
        </div>
      }
    >
      <ReportViewContent />
    </Suspense>
  );
}
