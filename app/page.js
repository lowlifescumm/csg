"use client";

export const dynamic = 'force-static';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Star, Heart, Check, Zap, Eye, Lock, Moon, Sun } from "lucide-react";
import FreeSampleModal from "@/components/FreeSampleModal";
import BackgroundStars from "@/components/BackgroundStars";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSampleModal, setShowSampleModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

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
      <div className="min-h-screen bg-cosmic-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cosmic-indigo"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-celestial relative">
      <BackgroundStars />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Decorative stars */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="text-cosmic-gold text-2xl opacity-60">✦</span>
          </div>
          
          <div className="mb-8">
            <Eye className="w-14 h-14 sm:w-16 sm:h-16 text-cosmic-indigo mx-auto opacity-80" />
          </div>
          
          <h1 className="heading-1 mb-6 px-2 leading-tight">
            Get Your Free
            <br />
            <span className="text-cosmic-purple">Tarot Reading</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-cosmic-indigo/70 mb-8 max-w-2xl mx-auto px-4 font-light">
            Your first 3-card tarot reading is <span className="text-cosmic-gold font-medium">completely free</span>.
            <br className="hidden sm:block" />
            No signup required.
          </p>
          
          {/* Primary CTA */}
          <button 
            onClick={() => setShowSampleModal(true)}
            className="btn-gold px-10 sm:px-12 py-4 sm:py-5 rounded-2xl font-semibold text-lg sm:text-xl mb-4"
          >
            ✨ Try Free Sample Reading
          </button>
          
          {/* Secondary CTA */}
          <button 
            onClick={() => router.push("/dashboard")}
            className="block mx-auto text-cosmic-indigo/60 font-medium hover:text-cosmic-purple transition-colors mb-10"
          >
            Already have an account? Get full reading →
          </button>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-cosmic-lavender/20">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-cosmic-gold text-cosmic-gold" />
                ))}
              </div>
              <span className="font-semibold text-cosmic-indigo">4.9</span>
              <span className="text-cosmic-indigo/50">(2,847 reviews)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-cosmic-lavender/20">
              <Sparkles className="w-4 h-4 text-cosmic-purple" />
              <span className="font-semibold text-cosmic-indigo">50,000+</span>
              <span className="text-cosmic-indigo/50">readings delivered</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-cosmic-lavender/20">
              <Lock className="w-4 h-4 text-cosmic-indigo/60" />
              <span className="font-medium text-cosmic-indigo/70">Private & Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Our Services</p>
            <h2 className="heading-2">
              Free Tarot, Birth Charts & Cosmic Guidance
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="celestial-card hover:border-cosmic-gold/40 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-cosmic-indigo w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-cosmic-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-cosmic-indigo">Personal tarot readings</h3>
                  <p className="text-cosmic-indigo/60">Tailored to your energy and intention</p>
                </div>
              </div>
            </div>
            
            <div className="celestial-card hover:border-cosmic-gold/40 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-cosmic-purple w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-cosmic-indigo">Clear explanations</h3>
                  <p className="text-cosmic-indigo/60">Not vague symbolism—real guidance</p>
                </div>
              </div>
            </div>
            
            <div className="celestial-card hover:border-cosmic-gold/40 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-cosmic-lavender w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-cosmic-indigo" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-cosmic-indigo">Action-focused guidance</h3>
                  <p className="text-cosmic-indigo/60">Insights you can use right now</p>
                </div>
              </div>
            </div>
            
            <div className="celestial-card hover:border-cosmic-gold/40 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-cosmic-gold to-amber-400 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-cosmic-indigo" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-cosmic-indigo">Emotionally supportive</h3>
                  <p className="text-cosmic-indigo/60">Designed to bring clarity and calm</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="gold-card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-cosmic-indigo mb-3">
              🎴 Get Your First 3-Card Reading Free
            </p>
            <p className="text-cosmic-indigo/60 text-lg">
              No credit card. No commitment. Just instant guidance.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white/40 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="heading-2 mb-4">How Free Tarot Readings Work</h2>
            <p className="text-lg text-cosmic-indigo/60">Simple, soulful, and always available.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-cosmic-indigo flex items-center justify-center mx-auto mb-6 relative">
                <span className="text-cosmic-gold text-3xl font-bold">1</span>
                <div className="absolute -top-1 -right-1 text-cosmic-gold">✦</div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cosmic-indigo">Set Your Intention</h3>
              <p className="text-cosmic-indigo/60">Love, purpose, healing, direction, or "open reading."</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-cosmic-purple flex items-center justify-center mx-auto mb-6 relative">
                <span className="text-white text-3xl font-bold">2</span>
                <div className="absolute -top-1 -right-1 text-cosmic-gold">✦</div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cosmic-indigo">AI Spirit Guide Interprets</h3>
              <p className="text-cosmic-indigo/60">Channels tarot meaning and intuition to deliver a personalized message.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-cosmic-gold flex items-center justify-center mx-auto mb-6 relative">
                <span className="text-cosmic-indigo text-3xl font-bold">3</span>
                <div className="absolute -top-1 -right-1 text-cosmic-indigo">✦</div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cosmic-indigo">Receive Instantly</h3>
              <p className="text-cosmic-indigo/60">A beautifully written insight based on your current energy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="heading-2 mb-4">Why Thousands Trust Cosmic Spirit Guide</h2>
            <p className="text-lg text-cosmic-indigo/60 max-w-2xl mx-auto">
              You don't need to be a tarot expert. Your guide interprets everything with clarity and heart.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              "Helps reduce anxiety and overthinking",
              "Offers direction when life feels uncertain",
              "Creates daily grounding and reflection",
              "Makes decision-making easier",
              "Feels personal — not random or generic",
              "Available anytime you need guidance"
            ].map((benefit, i) => (
              <div key={i} className="celestial-card flex items-start gap-3 hover:border-cosmic-gold/40">
                <Check className="w-5 h-5 text-cosmic-gold flex-shrink-0 mt-0.5" />
                <p className="text-cosmic-indigo/80 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-cosmic-indigo relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "Daily Tarot", desc: "Fresh readings every day" },
              { icon: Sun, title: "Birth Charts", desc: "Complete natal analysis" },
              { icon: Heart, title: "Compatibility", desc: "Relationship insights" },
              { icon: Moon, title: "Moon Phases", desc: "Lunar guidance" },
              { icon: Eye, title: "AI Interpretation", desc: "Clear card meanings" },
              { icon: Star, title: "Transit Forecasts", desc: "Planetary movements" },
            ].map((feature, i) => (
              <div key={i} className="mystical-card hover:border-cosmic-gold/40 transition-all">
                <feature.icon className="w-8 h-8 text-cosmic-gold mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 md:py-28 px-4 sm:px-6 bg-celestial relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Eye className="w-14 h-14 sm:w-16 sm:h-16 text-cosmic-indigo mx-auto opacity-70" />
          </div>
          
          <h2 className="heading-1 mb-6 px-4">
            Experience Your First
            <br />
            <span className="text-cosmic-purple">Reading Now</span>
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-10 text-cosmic-indigo/60 px-4">
            Connect with your Cosmic Spirit Guide and receive your daily guidance — instantly and free.
          </p>
          
          <button 
            onClick={() => router.push("/dashboard")}
            className="btn-primary px-12 py-5 rounded-2xl font-bold text-lg sm:text-xl"
          >
            Get Your Free Reading
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-cosmic-indigo/50">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-cosmic-gold" /> No credit card
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-cosmic-gold" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Free Sample Modal */}
      <FreeSampleModal 
        isOpen={showSampleModal} 
        onClose={() => setShowSampleModal(false)} 
      />
    </div>
  );
}
