"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Moon,
  Calendar,
  Heart,
  Sparkles,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  BookOpen,
  Star,
  Zap,
} from "lucide-react";

const REPORT_TYPES = [
  {
    id: "tarot",
    name: "Tarot Reading",
    icon: BookOpen,
    color: "from-purple-500 to-pink-500",
    description: "Test tarot card interpretation",
  },
  {
    id: "moon_reading",
    name: "Moon Reading",
    icon: Moon,
    color: "from-blue-500 to-cyan-500",
    description: "Test moon phase reading",
  },
  {
    id: "birth_chart",
    name: "Birth Chart",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
    description: "Test full natal chart analysis",
  },
  {
    id: "compatibility",
    name: "Compatibility Report",
    icon: Heart,
    color: "from-pink-500 to-red-500",
    description: "Test relationship compatibility",
  },
  {
    id: "transit_forecast_short",
    name: "Short Transit Forecast",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    description: "Test 7-14 day forecast",
  },
  {
    id: "transit_forecast_extended",
    name: "Extended Transit Forecast",
    icon: Calendar,
    color: "from-indigo-500 to-purple-500",
    description: "Test 30-90 day forecast",
  },
  {
    id: "ESSENTIAL",
    name: "Essential Premium Report",
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    description: "Tarot + Moon + Short Forecast ($49)",
    premium: true,
  },
  {
    id: "ADVANCED",
    name: "Advanced Premium Report",
    icon: Sparkles,
    color: "from-violet-500 to-purple-500",
    description: "Birth Chart + Compatibility + Forecast ($149)",
    premium: true,
  },
  {
    id: "MASTER",
    name: "Master Premium Report",
    icon: FileText,
    color: "from-rose-500 to-pink-500",
    description: "All sections including Destiny Path ($249)",
    premium: true,
  },
];

export default function TestReportsPage() {
  const router = useRouter();
  const [testing, setTesting] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewingContent, setViewingContent] = useState(false);

  const handleTestReport = async (reportType) => {
    setTesting(reportType);
    setResult(null);
    setError(null);
    setViewingContent(false);

    try {
      const response = await fetch("/api/admin/test-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_type: reportType,
          generate_html: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          reportType,
          ...data,
        });
      } else {
        setError(data.error || "Failed to generate report");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setTesting(null);
    }
  };

  const downloadReport = () => {
    if (!result?.content) return;

    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${result.reportType}-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    if (!result?.html) return;

    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${result.reportType}-${new Date().toISOString()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Test Report Generation</h1>
                <p className="text-gray-600">Generate and verify report quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Type Buttons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.filter((r) => !r.premium).map((report) => {
              const Icon = report.icon;
              const isTesting = testing === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => handleTestReport(report.id)}
                  disabled={isTesting || testing !== null}
                  className={`relative bg-gradient-to-r ${report.color} text-white rounded-xl p-6 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8" />
                    {isTesting && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
                  <p className="text-sm text-white/80">{report.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Premium Reports */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Premium Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REPORT_TYPES.filter((r) => r.premium).map((report) => {
              const Icon = report.icon;
              const isTesting = testing === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => handleTestReport(report.id)}
                  disabled={isTesting || testing !== null}
                  className={`relative bg-gradient-to-r ${report.color} text-white rounded-xl p-6 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group border-2 border-yellow-400/50`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8" />
                    {isTesting && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
                  <p className="text-sm text-white/80">{report.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Report Generated Successfully
                  </h3>
                  <p className="text-sm text-gray-600">
                    {result.report_type} • {result.metadata?.content_length || 0} characters
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingContent(!viewingContent)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                >
                  <Eye className="w-4 h-4" />
                  {viewingContent ? "Hide" : "View"}
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Download TXT
                </button>
                {result.html && (
                  <button
                    onClick={downloadHTML}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download HTML
                  </button>
                )}
              </div>
            </div>

            {result.sections && result.sections.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Sections: {result.sections.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.sections.map((section, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {section.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingContent && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {result.content}
                  </pre>
                </div>
              </div>
            )}

            {viewingContent && result.html && (
              <div className="mt-4 border-t border-gray-200 pt-6">
                <h4 className="font-semibold mb-2">HTML Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono">
                    {result.html.substring(0, 2000)}
                    {result.html.length > 2000 && "\n\n... (truncated, download full HTML to view)"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Quality Checklist</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Content is accurate and personalized (not generic)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Tone is warm, spiritual, and authoritative</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>No mentions of AI, software, or internal mechanics</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Data is interpreted, not just repeated</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Includes actionable guidance and next steps</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

