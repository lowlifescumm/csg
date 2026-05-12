'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, FileText, ArrowLeft, Loader2 } from 'lucide-react';

export default function ReportSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const reportId = searchParams.get('report');
  
  const [status, setStatus] = useState('loading');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Verify the session and get report details
    fetch(`/api/verify-payment?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setReportData(data);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-400 text-xl mb-4">⚠️ Unable to verify purchase</div>
          <p className="text-purple-200 mb-6">
            We couldn't confirm your payment. If you completed checkout, your report will be available shortly.
            Contact support if you need help.
          </p>
          <Link 
            href="/services" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Purchase Complete!</h1>
          <p className="text-purple-200">
            Your {reportData?.reportName || 'report'} has been unlocked.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <FileText className="w-8 h-8 text-purple-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {reportData?.reportName || 'Premium Report'}
              </h2>
              <p className="text-purple-200">
                Amount paid: ${reportData?.amount ? (reportData.amount / 100).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-4">
            <p className="text-purple-200 mb-4">
              Your report is being prepared. You can access it from your dashboard or generate it now.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/reports/${reportId?.toLowerCase()}`}
                className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all font-medium"
              >
                Generate My Report
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 text-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/services" 
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse More Services
          </Link>
        </div>
      </div>
    </div>
  );
}
