"use client";
import Link from "next/link";
import { ArrowLeft, Eye, Sparkles, Heart, Shield } from "lucide-react";

export default function AboutPage() {
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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold gradient-text mb-2">About Us</h1>
                <p className="text-purple-200">Learn more about Cosmic Spirit Guide</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="glassmorphic rounded-3xl p-8 sm:p-10 apple-shadow-lg border border-white border-opacity-40 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Our Mission
              </h2>
              <p className="text-purple-200 leading-relaxed">
                Cosmic Spirit Guide is dedicated to making spiritual guidance accessible, honest, and empowering. 
                We blend timeless tarot wisdom with advanced AI technology to deliver personalized insights that 
                help you navigate life&apos;s challenges with clarity and confidence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-400" />
                What We Believe
              </h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                We believe that spiritual tools should empower you, not scare you. Our readings are designed to:
              </p>
              <ul className="space-y-2 text-purple-200 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Provide clarity and direction when life feels uncertain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Offer support and encouragement, never fear-based predictions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Respect your autonomy and personal spiritual journey</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Be transparent about our AI-powered approach</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-400" />
                Our Commitment
              </h2>
              <p className="text-purple-200 leading-relaxed">
                We are committed to providing you with high-quality spiritual guidance that is ethical, 
                accessible, and genuinely helpful. Every day, we offer 3 free credits so that everyone can 
                access the insights they need, regardless of their financial situation. We believe in 
                transparency, honesty, and putting your well-being first.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
              <p className="text-purple-200 leading-relaxed">
                Our AI system is trained on tarot symbolism, archetypal wisdom, and intuitive language patterns. 
                When you request a reading, we combine your intention with the cards drawn to create a personalized 
                message that speaks directly to your current situation and energy. The result is guidance that 
                feels personal, relevant, and actionable.
              </p>
            </section>

            <div className="pt-6 border-t border-white border-opacity-20">
              <p className="text-purple-200 text-sm">
                Have questions? <Link href="/contact" className="text-purple-300 hover:text-white underline smooth-transition">Contact us</Link> — we&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

