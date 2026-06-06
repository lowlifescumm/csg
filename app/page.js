"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Star, Heart, Zap, Eye, Lock, Shield, Moon, Sun, Calendar, X } from "lucide-react";

// Testimonials data
const testimonials = [
  {
    name: "Sarah M.",
    location: "Portland, OR",
    text: "I've tried many tarot apps, but Cosmic Spirit Guide is different. The reading felt genuinely personal and gave me clarity during a confusing time.",
    rating: 5,
    service: "Premium Tarot"
  },
  {
    name: "James K.",
    location: "Austin, TX",
    text: "The birth chart reading was incredibly detailed. It explained things about myself I've never understood before. Worth every penny.",
    rating: 5,
    service: "Birth Chart"
  },
  {
    name: "Elena R.",
    location: "Miami, FL",
    text: "I was skeptical about AI tarot, but this exceeded my expectations. The daily horoscopes have become part of my morning routine.",
    rating: 5,
    service: "Daily Horoscope"
  },
  {
    name: "Michael T.",
    location: "Denver, CO",
    text: "The compatibility reading helped me understand my relationship better. It's spooky how accurate it was!",
    rating: 5,
    service: "Compatibility"
  }
];

// Services data
const services = [
  {
    icon: Sparkles,
    title: "Personal Tarot Readings",
    description: "Tailored to your energy and intention. Get clarity on love, career, and life's big questions.",
  },
  {
    icon: Eye,
    title: "Clear Explanations",
    description: "Not vague symbolism—real guidance you can understand and act on.",
  },
  {
    icon: Zap,
    title: "Action-Focused Guidance",
    description: "Insights you can use right now. Practical wisdom for everyday decisions.",
  },
  {
    icon: Heart,
    title: "Emotionally Supportive",
    description: "Designed to bring clarity and calm. A gentle guide through life's uncertainties.",
  }
];

// Features data
const features = [
  { icon: Sparkles, title: "Daily Tarot", desc: "Fresh readings every day" },
  { icon: Sun, title: "Birth Charts", desc: "Complete natal analysis" },
  { icon: Heart, title: "Compatibility", desc: "Relationship insights" },
  { icon: Moon, title: "Moon Phases", desc: "Lunar guidance" },
  { icon: Eye, title: "AI Interpretation", desc: "Clear card meanings" },
  { icon: Calendar, title: "Transit Forecasts", desc: "Planetary movements" },
];

// Email Capture Modal Component
function EmailCaptureModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      localStorage.setItem("csg_email_captured", "true");
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-cosmic-indigo border border-cosmic-gold/30 rounded-2xl p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-cosmic-gold/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-cosmic-gold" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              You're In!
            </h3>
            <p className="text-white/70">Check your inbox for your free 7-Day Tarot Mastery Guide.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-cosmic-gold/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cosmic-gold" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Before You Go...</h3>
              <p className="text-white/70 mb-2">Get Your Free</p>
              <p className="text-xl text-cosmic-gold font-semibold">7-Day Tarot Mastery Guide</p>
            </div>
            
            <ul className="text-sm text-white/60 mb-6 space-y-2">
              <li className="flex items-center gap-2"><span className="text-cosmic-gold">✓</span> Daily card meanings</li>
              <li className="flex items-center gap-2"><span className="text-cosmic-gold">✓</span> 3-card spread techniques</li>
              <li className="flex items-center gap-2"><span className="text-cosmic-gold">✓</span> Journaling prompts</li>
            </ul>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-cosmic-gold/50"
                required
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-6 py-3 rounded-lg font-semibold bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Me The Guide"}
              </button>
              <p className="text-xs text-white/40 text-center">No spam. Unsubscribe anytime.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [exitIntentTriggered, setExitIntentTriggered] = useState(false);

  useEffect(() => {
    checkAuth();
    
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !exitIntentTriggered && !localStorage.getItem("csg_email_captured")) {
        setExitIntentTriggered(true);
        setTimeout(() => setShowEmailModal(true), 100);
      }
    };
    
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [exitIntentTriggered]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (error) {
      console.error("Auth check failed");
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-indigo">
      {/* Celestial Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-1 h-1 bg-white/60 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-cosmic-gold/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-32 right-1/3 w-1 h-1 bg-cosmic-lavender/50 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cosmic-lavender/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cosmic-purple/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cosmic-gold/3 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-cosmic-gold/30 bg-cosmic-gold/10">
              <Eye className="w-8 h-8 text-cosmic-gold" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Discover Your Path
            <br />
            <span className="text-cosmic-gold">Through the Cards</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-4 max-w-2xl mx-auto font-light">
            Your first 3-card tarot reading is <span className="text-cosmic-gold font-medium">completely free</span>.
          </p>
          <p className="text-base sm:text-lg text-white/50 mb-10 max-w-xl mx-auto">
            No signup required. Just instant, AI-powered spiritual guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button 
              onClick={() => router.push("/free-tarot")}
              className="group px-10 py-5 rounded-full font-semibold text-lg transition-all duration-300 bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 hover:scale-105 hover:shadow-2xl hover:shadow-cosmic-gold/25"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Your Free Reading
              </span>
            </button>
            
            <button 
              onClick={() => router.push("/pricing")}
              className="px-8 py-5 rounded-full font-medium text-white border border-white/20 hover:bg-white/5 hover:border-white/30 transition-all duration-300"
            >
              View Pricing
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-cosmic-gold text-cosmic-gold" />
                ))}
              </div>
              <span className="font-semibold text-white">4.9</span>
              <span>(2,847 reviews)</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-cosmic-gold" />
              <span className="font-semibold text-white">50,000+</span>
              <span>readings delivered</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Shield className="w-4 h-4 text-cosmic-lavender" />
              <span>Private & Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-cosmic-midnight/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Our Services</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Free Tarot, Birth Charts & Cosmic Guidance
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Ancient wisdom meets modern AI. Get personalized insights that actually make sense.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {services.map((service, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cosmic-gold/30 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-cosmic-gold/20">
                    <service.icon className="w-7 h-7 text-cosmic-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2 text-white group-hover:text-cosmic-gold transition-colors">{service.title}</h3>
                    <p className="text-white/60 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center p-10 rounded-2xl border border-cosmic-gold/30 bg-gradient-to-br from-cosmic-gold/20 to-transparent">
            <p className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              🎴 Get Your First 3-Card Reading Free
            </p>
            <p className="text-white/70 text-lg mb-6">No credit card. No commitment. Just instant guidance.</p>
            <button onClick={() => router.push("/free-tarot")} className="px-8 py-4 rounded-full font-semibold bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 transition-all">
              Try It Now
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              How Cosmic Spirit Guide Works
            </h2>
            <p className="text-lg text-white/60">Simple, soulful, and always available.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Set Your Intention", desc: "Love, purpose, healing, direction, or 'open reading.'" },
              { num: "2", title: "AI Spirit Guide Interprets", desc: "Combines tarot meaning with your energy for a personalized message." },
              { num: "3", title: "Receive Instantly", desc: "A beautifully written insight based on your current situation." },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cosmic-gold/20 to-cosmic-gold/5 border border-cosmic-gold/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-cosmic-gold text-3xl font-bold">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
                <p className="text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-cosmic-midnight/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Everything You Need
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cosmic-gold/30 transition-all duration-300 group">
                <feature.icon className="w-8 h-8 text-cosmic-gold mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cosmic-gold text-sm font-medium tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Trusted by Seekers Worldwide
            </h2>
            <p className="text-lg text-white/60">Real guidance. Real impact.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cosmic-gold/30 transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-cosmic-gold text-cosmic-gold" />
                  ))}
                </div>
                <p className="text-white/80 text-lg leading-relaxed mb-6" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontStyle: 'italic' }}>
                  "{testimonial.text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-white/50">{testimonial.location}</p>
                  </div>
                  <span className="text-xs text-cosmic-gold/80 bg-cosmic-gold/10 px-3 py-1 rounded-full">{testimonial.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl border border-cosmic-gold/30 bg-gradient-to-b from-cosmic-gold/10 to-transparent">
            <div className="mb-6">
              <Eye className="w-12 h-12 text-cosmic-gold mx-auto" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Ready to Discover
              <br />
              <span className="text-cosmic-gold">Your Cosmic Path?</span>
            </h2>
            <p className="text-lg sm:text-xl mb-8 text-white/70 max-w-xl mx-auto">
              Join 50,000+ seekers who've found clarity through the cards.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => router.push("/free-tarot")} className="px-10 py-5 rounded-full font-semibold text-lg bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 transition-all hover:scale-105">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Get Your Free Reading
                </span>
              </button>
              <button onClick={() => router.push("/login")} className="px-8 py-5 rounded-full font-medium text-white border border-white/20 hover:bg-white/5 transition-all">
                Sign Up for Full Access
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> No credit card required</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture Modal */}
      <EmailCaptureModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </div>
  );
}
