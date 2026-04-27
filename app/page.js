"use client";

export const dynamic = 'force-static';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Star, Heart, Check, ChevronRight, Zap, Shield, Eye, ArrowRight, Lock } from "lucide-react";
import FreeSampleModal from "@/components/FreeSampleModal";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSampleModal, setShowSampleModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block float-animation mb-6">
            <Eye className="w-16 h-16 sm:w-20 sm:h-20 text-purple-600 mx-auto" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 gradient-text px-2 leading-tight">
            Get Your Free Tarot Reading
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto px-4">
            Get your <strong className="text-purple-600">first 3-card tarot reading free</strong>. No signup required.
          </p>
          
          {/* Primary CTA - Try Sample First */}
          <button 
            onClick={() => setShowSampleModal(true)}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-semibold text-lg sm:text-xl smooth-transition hover:shadow-2xl hover:scale-105 mb-3"
          >
            ✨ Try Free Sample Reading
          </button>
          
          {/* Secondary CTA */}
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 font-medium hover:text-purple-800 smooth-transition mb-6"
          >
            Already have an account? Get full reading →
          </button>

          {/* Trust Signals - Above the Fold */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600">
            {/* Star Rating */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-100">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold text-gray-800">4.9</span>
              <span className="text-gray-500">(2,847 reviews)</span>
            </div>

            {/* Readings Delivered */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-100">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-gray-800">50,000+</span>
              <span className="text-gray-500">readings delivered</span>
            </div>

            {/* Privacy Badge */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-100">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700">Private & Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You Receive - Semantic Content Structure */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Free Tarot, Birth Charts & Cosmic Guidance
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Personal tarot readings</h3>
                  <p className="text-gray-600">Tailored to your energy and intention</p>
                </div>
              </div>
            </div>
            
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Clear explanations</h3>
                  <p className="text-gray-600">Not vague symbolism</p>
                </div>
              </div>
            </div>
            
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-pink-500 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Action-focused guidance</h3>
                  <p className="text-gray-600">You can use right now</p>
                </div>
              </div>
            </div>
            
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Emotionally supportive messages</h3>
                  <p className="text-gray-600">Designed to bring clarity and calm</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 sm:p-8 text-center border border-purple-200">
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              🎴 Get Your First 3-Card Reading Free
            </p>
            <p className="text-gray-600 text-lg">
              No credit card. No commitment. Just instant guidance.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - H2 Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              How Free Tarot Readings Work
            </h2>
            <p className="text-lg text-gray-600">
              Simple, soulful, and always available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Set Your Intention</h3>
              <p className="text-gray-600">Love, purpose, healing, direction, or &quot;open reading.&quot;</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Your AI Spirit Guide Interprets Your Cards</h3>
              <p className="text-gray-600">The system channels tarot meaning, intuition modeling, and spiritual archetypes to deliver a personalized message.</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Receive Your Reading Instantly</h3>
              <p className="text-gray-600">A beautifully written, easy-to-understand insight based on your current energy and chosen focus.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why People Love This - H2 Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Why Thousands Trust Cosmic Spirit Guide
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              You don&apos;t need to be a tarot expert.<br />
              Your guide interprets everything for you with clarity and heart.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              "Helps reduce anxiety and overthinking",
              "Offers direction when life feels uncertain",
              "Creates daily grounding and reflection",
              "Makes decision-making easier",
              "Feels personal — not random or generic"
            ].map((benefit, i) => (
              <div key={i} className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 font-medium">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Reading - H2 Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">
              Example Tarot Reading
            </h2>
          </div>
          
          <div className="glassmorphic rounded-3xl p-8 sm:p-12 border border-white border-opacity-40 text-center">
            <div className="inline-block mb-6">
              <Sparkles className="w-12 h-12 text-purple-600" />
            </div>
            <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-700 italic leading-relaxed">
              &quot;Your energy shows a shift from hesitation toward quiet inner strength. The card speaks of a path opening — one you may not fully trust yet. Your guide encourages you to step into it with patience and confidence. What you seek is seeking you as well.&quot;
            </blockquote>
          </div>
        </div>
      </section>

      {/* Ethics & Transparency - H2 Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Honest, Transparent Spiritual Guidance
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              We believe spiritual tools should empower you — not scare you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">No fear-based predictions</h3>
                  <h3 className="font-semibold text-lg mb-2">No harmful messages</h3>
                  <h3 className="font-semibold text-lg mb-2">No judgment</h3>
                </div>
              </div>
              <p className="text-gray-600">Always uplifting and supportive</p>
            </div>
            
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
              <div className="flex items-start gap-3">
                <Eye className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 mb-3">
                    <strong>Fully upfront:</strong> your readings are generated by advanced AI trained on tarot wisdom, symbolism, and intuitive language
                  </p>
                  <p className="text-gray-600">
                    You stay in control of your spiritual journey
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xl text-gray-700 font-semibold">
              This is modern spirituality: mystical + honest + accessible.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ - H2 Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Free Tarot Reading FAQ
            </h2>
          </div>
          
          <div className="space-y-4">
            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>Is this AI or spiritual?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                It&apos;s a blend. The readings come from an AI system trained on tarot, archetypes, and spiritual interpretation. The goal is clarity, empowerment, and emotional resonance.
              </p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>How personalized are the readings?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                Each reading responds to your intention, your situation, and the energy you bring at that moment.
              </p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>Is the first reading really free?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                Yes. Your first 3-card tarot reading is completely free — no credit card required. Just ask your question and receive instant guidance.
              </p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>How fast do I receive the reading?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                Instantly. No waiting, no appointments.
              </p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>Can I get more readings after the free one?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                Yes — after your free reading, you can purchase individual readings or upgrade to Premium for unlimited access.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 md:py-28 px-4 sm:px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Eye className="w-16 h-16 sm:w-20 sm:h-20 text-white mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 px-4">
            Experience Your First Reading Now
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-purple-200 px-4">
            Connect with your Cosmic Spirit Guide and receive your daily guidance — instantly and free.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-white text-purple-900 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl smooth-transition hover:shadow-2xl hover:scale-105"
          >
            Get Your Free Reading
          </button>
        </div>
      </section>

      {/* Free Sample Modal */}
      <FreeSampleModal 
        isOpen={showSampleModal} 
        onClose={() => setShowSampleModal(false)} 
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/CSG_LOGO.svg" alt="Cosmic Spirit Guide" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-gray-400">Guided by the stars, powered by insight.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => router.push("/dashboard")} className="hover:text-white smooth-transition">Tarot Readings</button></li>
                <li><button onClick={() => router.push("/birth-chart")} className="hover:text-white smooth-transition">Free Birth Charts</button></li>
                <li><button onClick={() => router.push("/compatibility")} className="hover:text-white smooth-transition">Compatibility Reports</button></li>
                <li><button onClick={() => router.push("/moon-reading")} className="hover:text-white smooth-transition">Moon Readings</button></li>
                <li><button onClick={() => router.push("/transits")} className="hover:text-white smooth-transition">Transit Forecasts</button></li>
                <li><button onClick={() => router.push("/services")} className="hover:text-white smooth-transition">View All Services</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-white smooth-transition">Blog</Link></li>
                <li><Link href="/about" className="hover:text-white smooth-transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white smooth-transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white smooth-transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white smooth-transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Cosmic Spirit Guide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
