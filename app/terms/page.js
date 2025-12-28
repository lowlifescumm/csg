"use client";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      <div className="p-8 sm:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white smooth-transition mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-semibold gradient-text mb-2">Terms of Service</h1>
                  <p className="text-purple-200">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:max-w-xs">
                <img 
                  src="https://res.cloudinary.com/dfgthvwaa/image/upload/v1766824891/Secure_and_trusted_zmjbaq.webp" 
                  alt="Cosmic Spirit Guide terms of service and user agreement policy."
                  className="w-full h-auto rounded-xl shadow-lg object-cover"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="glassmorphic rounded-3xl p-8 sm:p-10 apple-shadow-lg border border-white border-opacity-40 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                Acceptance of Terms
              </h2>
              <p className="text-purple-200 leading-relaxed">
                By accessing and using Cosmic Spirit Guide, you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                Use License
              </h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                Permission is granted to temporarily access the materials on Cosmic Spirit Guide&apos;s website for 
                personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, 
                and under this license you may not:
              </p>
              <ul className="space-y-2 text-purple-200 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Modify or copy the materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Use the materials for any commercial purpose or for any public display</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Attempt to reverse engineer any software contained on the website</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Remove any copyright or other proprietary notations from the materials</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Service Description</h2>
              <p className="text-purple-200 leading-relaxed">
                Cosmic Spirit Guide provides AI-powered tarot readings, birth chart interpretations, and other 
                spiritual guidance services. Our readings are generated using advanced AI technology trained on 
                tarot symbolism and spiritual wisdom. While we strive to provide accurate and helpful guidance, 
                our services are for entertainment and personal reflection purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">User Accounts</h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                When you create an account with us, you must provide information that is accurate, complete, 
                and current at all times. You are responsible for safeguarding the password and for all activities 
                that occur under your account.
              </p>
              <p className="text-purple-200 leading-relaxed">
                You agree not to disclose your password to any third party and to take sole responsibility for 
                any activities or actions under your account, whether or not you have authorized such activities or actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Free Credits</h2>
              <p className="text-purple-200 leading-relaxed">
                We offer 3 free credits daily to all registered users. These credits are provided at our discretion 
                and may be modified or discontinued at any time. Free credits cannot be transferred, sold, or accumulated 
                beyond the daily allocation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Subscriptions and Payments</h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                If you purchase a subscription or additional credits, you agree to pay the fees specified. All fees 
                are non-refundable except as required by law. Subscriptions will automatically renew unless cancelled 
                before the renewal date.
              </p>
              <p className="text-purple-200 leading-relaxed">
                You may cancel your subscription at any time through your account settings. Cancellation will take 
                effect at the end of the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
              <p className="text-purple-200 leading-relaxed">
                The materials on Cosmic Spirit Guide are provided on an &apos;as is&apos; basis. Cosmic Spirit Guide 
                makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties 
                including, without limitation, implied warranties or conditions of merchantability, fitness for a 
                particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Limitations</h2>
              <p className="text-purple-200 leading-relaxed">
                In no event shall Cosmic Spirit Guide or its suppliers be liable for any damages (including, without 
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the 
                use or inability to use the materials on Cosmic Spirit Guide&apos;s website, even if Cosmic Spirit Guide 
                or a Cosmic Spirit Guide authorized representative has been notified orally or in writing of the possibility 
                of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Revisions</h2>
              <p className="text-purple-200 leading-relaxed">
                Cosmic Spirit Guide may revise these terms of service at any time without notice. By using this website 
                you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <p className="text-purple-200 leading-relaxed">
                If you have any questions about these Terms of Service, please <Link href="/contact" className="text-purple-300 hover:text-white underline smooth-transition">contact us</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}




