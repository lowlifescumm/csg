"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, Heart, Check, ChevronRight, Zap, Shield, Eye, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 gradient-text px-2">
            Connect With Your Cosmic Spirit Guide — Get Daily Tarot Insights for Free
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto px-4">
            Receive spiritually aligned tarot readings powered by advanced AI guidance.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4">
            Clear answers. Gentle direction. <strong className="text-purple-600">3 free credits every single day.</strong>
          </p>
          
          <button 
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-semibold text-lg sm:text-xl smooth-transition hover:shadow-2xl hover:scale-105 mb-12"
          >
            Get Your Free Readings
          </button>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg sm:text-xl text-gray-700 mb-2">
            Trusted by thousands seeking clarity, direction, and calm.
          </p>
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Real guidance. Real insight. Zero guesswork.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40 text-left">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-3">
                &quot;Shockingly accurate. The readings felt like they were written for my soul.&quot;
              </p>
            </div>
            
            <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40 text-left">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-3">
                &quot;The daily free credits keep me grounded — it&apos;s part of my morning ritual now.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Receive */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Your Cosmic Spirit Guide gives you:
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
            <p className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              3 free credits every day — no commitment, no tricks
            </p>
            <p className="text-gray-600">
              Every reading blends timeless tarot symbolism with advanced AI interpretation to create messages uniquely aligned to you.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              How It Works
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

      {/* Why People Love This */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Why People Love This
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

      {/* Sample Reading Snippet */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">
              Sample Reading Snippet
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

      {/* Ethics & Transparency */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              Ethics & Transparency
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

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-4">
              FAQ
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
                <span>Do I really get 3 free credits daily?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                Yes. Every day your account refreshes automatically — no card required.
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
                <span>Can I use it multiple times a day?</span>
                <ChevronRight className="w-5 h-5 transform transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-gray-600">
                Yes — use your free credits daily, or get additional readings anytime.
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
            onClick={() => router.push("/login")}
            className="bg-white text-purple-900 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl smooth-transition hover:shadow-2xl hover:scale-105"
          >
            Get Your Free Readings
          </button>
        </div>
      </section>

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
                <li><button onClick={() => router.push("/birth-chart")} className="hover:text-white smooth-transition">Birth Charts</button></li>
                <li><button onClick={() => router.push("/compatibility")} className="hover:text-white smooth-transition">Compatibility</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white smooth-transition">Blog</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">About Us</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white smooth-transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">Privacy Policy</a></li>
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
