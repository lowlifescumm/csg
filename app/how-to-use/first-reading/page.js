"use client";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, CreditCard, Sparkles, Calendar, MessageSquare, BookOpen } from "lucide-react";

export default function FirstReadingGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back Link */}
        <Link
          href="/how-to-use"
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to How to Use Guide</span>
        </Link>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">
            How to Get Your First Reading on Cosmic Spirit Guide
          </h1>
          <p className="text-xl text-gray-600">
            A step-by-step guide to successfully navigate the process of obtaining your first credit-based reading.
          </p>
        </div>

        {/* Purpose Section */}
        <section className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Purpose</h2>
          <p className="text-gray-700 leading-relaxed">
            This easy-to-follow guide is intended for new and existing users to successfully navigate the process of obtaining their first credit-based reading on cosmicspiritguide.com. The goal is to ensure a smooth and informed user experience, minimizing confusion and maximizing the value derived from the platform&apos;s spiritual guidance services.
          </p>
        </section>

        {/* Scope Section */}
        <section className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Scope</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            This guide applies to all registered users of cosmicspiritguide.com, regardless of their subscription status (Free Tier, Mystic Lite, or Mystic Premium). It specifically covers the procedure for initiating any reading service that requires the use of platform credits, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Various Tarot readings</li>
            <li>Moon Readings</li>
            <li>Birth Chart analyses</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            <strong>Note:</strong> This guide does not cover the process for purchasing or accessing Direct-Pay Premium Reports.
          </p>
        </section>

        {/* Procedure Section */}
        <section className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Procedure: Step-by-Step Guide to Obtaining a Reading
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            The process for obtaining a reading is streamlined and typically takes less than five minutes, depending on the type of reading selected.
          </p>

          {/* Step 3.1 */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Access the Dashboard and Verify Credits
                </h3>
                <p className="text-gray-600 mb-4">
                  The user must first ensure they have the necessary resources to initiate a reading.
                </p>
              </div>
            </div>

            <div className="ml-11 space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Log In</h4>
                  <p className="text-gray-700">
                    Navigate to the cosmicspiritguide.com website and log in to your user account.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CreditCard className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Verify Credit Balance</h4>
                  <p className="text-gray-700 mb-3">
                    Check the current credit balance displayed on the Dashboard.
                  </p>
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-800 font-medium mb-2">
                      <strong>New Users/Free Tier:</strong> The system automatically provides 3 free daily credits that refresh every 24 hours. These credits are typically eligible for &quot;Standard Tarot&quot; readings (e.g., Daily Tarot, Love Tarot, Career Tarot).
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      <strong>Paid Users:</strong> Ensure your purchased or subscription credits are available. If the balance is low, credits can be purchased via the &quot;Get Credits&quot; link in the navigation bar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3.2 */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Reading Service
                </h3>
                <p className="text-gray-600 mb-4">
                  The user selects the type of reading that aligns with their current needs or inquiry.
                </p>
              </div>
            </div>

            <div className="ml-11 space-y-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Navigate to Services</h4>
                  <p className="text-gray-700">
                    Access the full list of services via the &quot;Services&quot; link or the &quot;Deep Dive Insights&quot; section on the Dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Choose a Reading</h4>
                  <p className="text-gray-700 mb-3">
                    Select a reading based on the topic and credit cost. For a first reading, the Daily Tarot (1 Credit) is recommended as a low-cost, immediate option.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-800 font-medium mb-2">
                      <strong>Example Readings and Costs:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Daily Tarot (1 Credit)</li>
                      <li>Moon Reading (2 Credits)</li>
                      <li>Compatibility Report (5 Credits)</li>
                      <li>Birth Chart Reading (12 Credits)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Confirm Requirements</h4>
                  <p className="text-gray-700">
                    For astrological readings (e.g., Birth Chart, Compatibility), ensure your accurate birth data (date, time, and location) is already entered in your profile, as this data is crucial for the system&apos;s NASA-quality calculations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3.3 */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connect with the Guide (Set Intent)
                </h3>
                <p className="text-gray-600 mb-4">
                  This step personalizes the reading by focusing the AI&apos;s interpretation on the user&apos;s specific question or situation.
                </p>
              </div>
            </div>

            <div className="ml-11 space-y-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Initiate Card Selection (Tarot)</h4>
                  <p className="text-gray-700">
                    For Tarot readings, the system will prompt the user to select their cards by clicking on the card backs displayed on the screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Enter Intent</h4>
                  <p className="text-gray-700 mb-3">
                    A prompt will appear asking, &quot;What is weighing on your heart right now?&quot;
                  </p>
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-800 font-medium mb-2">
                      <strong>Best Practice:</strong> Share a specific question, concern, or situation. The more specific the input, the clearer and more personalized the guidance will be.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Generate Reading</h4>
                  <p className="text-gray-700">
                    Click the &quot;Reveal Answers&quot; or &quot;Start Reading&quot; button to submit the request and deduct the required credits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3.4 */}
          <div className="mb-8">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Review and Save the Reading
                </h3>
                <p className="text-gray-600 mb-4">
                  The system will process the request and deliver the final interpretation.
                </p>
              </div>
            </div>

            <div className="ml-11 space-y-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Wait for Generation</h4>
                  <p className="text-gray-700">
                    The system will display a &quot;Consulting the cards...&quot; or similar message while the AI generates the interpretation. Processing time varies by reading type (e.g., Tarot is instant, Birth Chart takes 10-30 seconds).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Review Interpretation</h4>
                  <p className="text-gray-700">
                    The full reading, including the card meanings, planetary analysis, and personalized guidance, will be displayed on the screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Save to Journal</h4>
                  <p className="text-gray-700">
                    Use the &quot;Save to Journal&quot; option to store the reading in the Spiritual Journal for future reference and reflection. All readings are also automatically saved in the &quot;Reading History&quot; section of the Dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Responsibilities Section */}
        <section className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Responsibilities</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            The following table outlines the key responsibilities for the User and the Cosmic Spirit Guide System (CSG) during the reading process.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Role</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Responsibility</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">User</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Maintain accurate profile information (especially birth data).</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">User</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Ensure sufficient credits are available before initiating a reading.</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">User</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Select the appropriate reading type for their inquiry.</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">User</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Provide a clear and specific intent/question (optional but recommended).</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">CSG System</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Manage and track the user&apos;s credit balance and daily credit refresh.</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">CSG System</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Perform accurate astrological calculations and card selection.</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">CSG System</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Generate and deliver the AI-powered reading interpretation.</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">CSG System</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Automatically save all completed readings to the user&apos;s Reading History.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Contingencies Section */}
        <section className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/50">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contingencies</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            This section addresses potential issues that may arise during the process and provides clear steps for resolution.
          </p>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Insufficient Credits</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cause:</strong> User attempts to initiate a reading without the required credit balance.
                  </p>
                  <p className="text-sm text-gray-800">
                    <strong>Action:</strong> Purchase a credit pack via the &quot;Get Credits&quot; link, or wait for the next daily refresh of 3 free credits.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Inaccurate Astrological Reading</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cause:</strong> Reading is based on incorrect birth date, time, or location data.
                  </p>
                  <p className="text-sm text-gray-800">
                    <strong>Action:</strong> Navigate to the &quot;My Birth Chart&quot; section and use the &quot;Update Chart&quot; or &quot;Create New&quot; function to correct the birth data. Rerun the reading after updating.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Reading Fails to Load</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cause:</strong> A temporary technical issue or network interruption occurred during generation.
                  </p>
                  <p className="text-sm text-gray-800">
                    <strong>Action:</strong> Check the &quot;Reading History&quot; section. If the reading is not there, wait 30 seconds and attempt to re-run the reading from the history or re-initiate the process. If the issue persists, contact support.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Unclear Interpretation</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cause:</strong> The reading is too general or does not address the user&apos;s core concern.
                  </p>
                  <p className="text-sm text-gray-800">
                    <strong>Action:</strong> When initiating the next reading, ensure a more specific and detailed question is entered in the &quot;Connect with the Guide&quot; intent box.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Guide Link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/how-to-use"
            className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to How to Use Guide</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

