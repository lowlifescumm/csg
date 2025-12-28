"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, FileText, ArrowLeft } from "lucide-react";
import { PREMIUM_REPORTS } from "@/lib/pricing";

export default function PremiumReportCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const reportId = searchParams.get("reportId");

    if (success === "true" && reportId) {
      const reportData = PREMIUM_REPORTS[reportId.toUpperCase()];
      if (reportData) {
        setReport(reportData);
        setStatus("success");
      } else {
        setError("Invalid report ID");
        setStatus("error");
      }
    } else {
      setStatus("error");
      setError("Missing payment confirmation");
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="glassmorphic rounded-3xl p-8 sm:p-10 apple-shadow-lg border border-white border-opacity-40 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Payment Failed</h1>
            <p className="text-purple-200 mb-6">
              {error || "There was an issue processing your payment. Please try again."}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/services"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition"
              >
                Back to Services
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 transition border border-white border-opacity-20"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="glassmorphic rounded-3xl p-8 sm:p-10 apple-shadow-lg border border-white border-opacity-40">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-xl text-purple-200">
              Your {report?.name} has been purchased successfully
            </p>
          </div>

          {report && (
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 mb-6 border border-white border-opacity-20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{report.name}</h2>
                  <p className="text-purple-200 text-sm">{report.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-400">
                    ${(report.priceInCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t border-white border-opacity-20 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-white mb-3">What's Included:</h3>
                <ul className="space-y-2">
                  {report.includes.map((item, idx) => (
                    <li key={idx} className="text-purple-200 flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold text-white">Turnaround:</span> {report.turnaround}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded-xl p-4 mb-6">
            <p className="text-blue-200 text-sm">
              <span className="font-semibold">Next Steps:</span> Your report is being generated automatically. 
              It will be available in your <Link href="/premium-reports" className="underline hover:text-blue-100">My Reports</Link> section within {report?.turnaround || '2-8 minutes'}. 
              You can download the PDF once it's ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/services"
              className="flex-1 px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 transition border border-white border-opacity-20 text-center flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

