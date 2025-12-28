"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Download, Clock, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { PREMIUM_REPORTS } from "@/lib/pricing";

export default function PremiumReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/premium-reports");
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
      } else {
        setError(data.error || "Failed to load reports");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handleGenerate = async (orderId) => {
    try {
      const response = await fetch("/api/premium-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the reports list
        await fetchReports();
        alert("Report generation started! It will appear here when ready.");
      } else {
        alert(data.error + (data.details ? ": " + data.details : ""));
      }
    } catch (err) {
      console.error("Error triggering generation:", err);
      alert("Failed to start report generation. Please try again.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-purple-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Ready";
      case "processing":
        return "Generating...";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-purple-200">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white smooth-transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Premium Reports</h1>
              <p className="text-purple-200">View and download your purchased reports</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="glassmorphic rounded-2xl p-6 mb-6 border border-red-400 border-opacity-30 bg-red-500 bg-opacity-10">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="glassmorphic rounded-3xl p-12 text-center apple-shadow-lg border border-white border-opacity-40">
            <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Reports Yet</h2>
            <p className="text-purple-200 mb-6">
              Purchase a premium report to see it here
            </p>
            <Link
              href="/services"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition"
            >
              Browse Reports
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const reportInfo = PREMIUM_REPORTS[report.reportType];
              return (
                <div
                  key={report.id}
                  className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(report.status)}
                        <h3 className="text-2xl font-bold text-white">{report.reportName}</h3>
                        <span className="px-3 py-1 bg-white bg-opacity-10 rounded-full text-sm text-purple-200">
                          {getStatusText(report.status)}
                        </span>
                      </div>

                      {reportInfo && (
                        <p className="text-purple-200 mb-4">{reportInfo.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-purple-300">Purchased:</span>
                          <p className="text-white font-semibold">{formatDate(report.createdAt)}</p>
                        </div>
                        <div>
                          <span className="text-purple-300">Amount:</span>
                          <p className="text-white font-semibold">${report.amountPaid.toFixed(2)}</p>
                        </div>
                        {report.completedAt && (
                          <div>
                            <span className="text-purple-300">Completed:</span>
                            <p className="text-white font-semibold">{formatDate(report.completedAt)}</p>
                          </div>
                        )}
                      </div>

                      {report.errorMessage && (
                        <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg">
                          <p className="text-red-200 text-sm">{report.errorMessage}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {report.status === "completed" && report.pdfUrl ? (
                        <button
                          onClick={() => handleDownload(report.pdfUrl)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition"
                        >
                          <Download className="w-5 h-5" />
                          Download PDF
                        </button>
                      ) : report.status === "processing" ? (
                        <div className="flex items-center gap-2 px-6 py-3 bg-yellow-500 bg-opacity-20 text-yellow-200 font-semibold rounded-xl border border-yellow-400 border-opacity-30">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </div>
                      ) : report.status === "failed" ? (
                        <button
                          onClick={() => handleGenerate(report.id)}
                          className="px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 transition border border-white border-opacity-20"
                        >
                          Retry Generation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerate(report.id)}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition"
                        >
                          Generate Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

