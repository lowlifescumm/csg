"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Play, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { PREMIUM_REPORTS } from "@/lib/pricing";
import PartnerDataForm from "@/components/PartnerDataForm";

export default function TestPremiumReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState("ESSENTIAL");
  const [userId, setUserId] = useState("");
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerData, setPartnerData] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/user");
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        if (data.user.role !== "admin") {
          router.push("/dashboard");
        }
        setUserId(data.user.id.toString());
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPurchaseClick = () => {
    // Show partner form for Advanced/Master reports
    if (selectedReport === 'ADVANCED' || selectedReport === 'MASTER') {
      setShowPartnerForm(true);
    } else {
      // Essential report doesn't need partner data
      handleTestPurchase(null);
    }
  };

  const handlePartnerDataComplete = (data) => {
    setPartnerData(data);
    setShowPartnerForm(false);
    handleTestPurchase(data);
  };

  const handleTestPurchase = async (partnerDataToSend = null) => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/test-premium-report-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: selectedReport,
          userId: userId || undefined, // Use authenticated user if not specified
          partnerData: partnerDataToSend?.partnerData || null,
          skipPartnerData: partnerDataToSend?.skipPartnerData || false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setPartnerData(null); // Clear partner data after successful test
      } else {
        // Check if partner data is required
        if (data.requiresPartnerData) {
          setError(data.message || "Partner data is required for this report type");
          setShowPartnerForm(true);
        } else {
          setError(data.error || data.message || "Failed to create test purchase");
        }
      }
    } catch (err) {
      console.error("Test purchase error:", err);
      setError(err.message || "Failed to create test purchase");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Test Premium Report Purchase</h1>
              <p className="text-gray-600">Simulate a premium report purchase without Stripe payment</p>
            </div>
          </div>
        </div>

        {/* Test Form */}
        <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={testing}
              >
                {Object.values(PREMIUM_REPORTS).map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.name} - ${(report.priceInCents / 100).toFixed(2)} ({report.description})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (optional - defaults to your account)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Leave empty to use your account"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={testing}
              />
              <p className="text-sm text-gray-500 mt-1">
                Your User ID: {user?.id} | Email: {user?.email}
              </p>
            </div>

            {(selectedReport === 'ADVANCED' || selectedReport === 'MASTER') && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Advanced and Master reports require partner data for compatibility sections. 
                  You can provide partner information or skip it.
                </p>
              </div>
            )}

            <button
              onClick={handleTestPurchaseClick}
              disabled={testing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Test Purchase...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Create Test Purchase</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="glassmorphic rounded-2xl p-6 mb-6 border border-red-400 border-opacity-30 bg-red-50">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Test Purchase Created Successfully!</h3>
            </div>

            <div className="bg-white bg-opacity-50 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Order Details:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li><strong>Order ID:</strong> {result.order.id}</li>
                <li><strong>Report:</strong> {result.order.reportName}</li>
                <li><strong>User ID:</strong> {result.order.userId}</li>
                <li><strong>User Email:</strong> {result.order.userEmail}</li>
                <li><strong>Amount:</strong> ${result.order.amountPaid.toFixed(2)}</li>
                <li><strong>Status:</strong> {result.order.status}</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {result.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4">
              <a
                href="/premium-reports"
                target="_blank"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition text-center"
              >
                View My Reports
              </a>
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
              >
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Test:</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Select a report type from the dropdown</li>
            <li>Optionally specify a user ID (or leave empty to use your account)</li>
            <li>Click "Create Test Purchase" to simulate a purchase</li>
            <li>The system will create an order and trigger report generation</li>
            <li>Navigate to "My Reports" to see the order status</li>
            <li>Once generation completes, you can download the PDF</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This creates a real order in the database but doesn't process payment through Stripe. 
              The report will be generated using your account's birth chart data.
            </p>
          </div>
        </div>

        {/* Partner Data Form Modal */}
        <PartnerDataForm
          isOpen={showPartnerForm}
          onClose={() => {
            setShowPartnerForm(false);
            setPartnerData(null);
          }}
          onComplete={handlePartnerDataComplete}
          reportType={selectedReport}
        />
      </div>
    </div>
  );
}

