"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, Moon, Sun, Calendar, MapPin, Clock, ChevronRight, Users, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

// Testimonials for birth chart
const testimonials = [
  {
    name: "Jessica R.",
    location: "San Diego, CA",
    text: "Finally! A birth chart that actually explained my personality. The free wheel was beautiful and the interpretation was spot-on.",
    rating: 5,
  },
  {
    name: "David M.",
    location: "Denver, CO",
    text: "I\'ve paid $50+ for other birth chart readings. This free one was more accurate and detailed. Seriously impressive.",
    rating: 5,
  },
  {
    name: "Amanda K.",
    location: "Austin, TX",
    text: "The birth chart helped me understand why I connect with certain people. Now I check compatibility before every date!",
    rating: 5,
  },
];

// Features of the birth chart
const features = [
  { icon: Sun, title: "Sun Sign Analysis", desc: "Your core identity and ego" },
  { icon: Moon, title: "Moon Sign", desc: "Your emotional inner world" },
  { icon: MapPin, title: "Rising Sign", desc: "How others perceive you" },
  { icon: Star, title: "Planet Placements", desc: "All 10 planetary positions" },
  { icon: Calendar, title: "House System", desc: "12 astrological houses mapped" },
  { icon: Clock, title: "Accurate Timing", desc: "Precise calculations" },
];

export default function FreeBirthChartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthLocation: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.birthDate) newErrors.birthDate = "Birth date is required";
    if (!formData.birthTime) newErrors.birthTime = "Birth time is required";
    if (!formData.birthLocation.trim()) newErrors.birthLocation = "Birth location is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    
    // Store form data in localStorage for use on next page
    localStorage.setItem("birthChartData", JSON.stringify(formData));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Redirect to birth chart creation with the data
    router.push("/birth-chart?autoFill=true");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      {/* Celestial Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-1 h-1 bg-white/60 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-amber-400/40 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white font-semibold text-lg">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Cosmic Spirit Guide
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm hidden sm:inline">Already have an account?</span>
              <Link 
                href="/login" 
                className="px-4 py-2 rounded-full text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Headline & Social Proof */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/30 mb-6">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-200 text-sm font-medium">100% Free • No Credit Card Required</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Discover Your True
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400"> Cosmic Identity</span>
                </h1>

                <p className="text-xl text-white/70 mb-6 max-w-lg">
                  Get your personalized birth chart wheel + detailed interpretation in 60 seconds.
                </p>

                <p className="text-white/50 mb-8">
                  Reveal your Sun, Moon, Rising signs and all planetary placements based on your exact birth details.
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-white text-sm"><strong className="text-amber-400">50,000+</strong> charts created</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-white/70 text-sm">Private & Secure</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white/70 text-sm">ASTRO-LOGIC Certified</span>
                  </div>
                </div>
              </div>

              {/* Right: Lead Capture Form */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Get Your Free Birth Chart</h2>
                    <p className="text-white/60 text-sm">Enter your details below for instant results</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Sarah Johnson"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50 transition-colors"
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-1.5">Birth Date</label>
                        <input
                          type="date"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-amber-400/50 transition-colors"
                        />
                        {errors.birthDate && <p className="text-red-400 text-xs mt-1">{errors.birthDate}</p>}
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-1.5">Birth Time</label>
                        <input
                          type="time"
                          name="birthTime"
                          value={formData.birthTime}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-amber-400/50 transition-colors"
                        />
                        {errors.birthTime && <p className="text-red-400 text-xs mt-1">{errors.birthTime}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Birth Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          name="birthLocation"
                          value={formData.birthLocation}
                          onChange={handleChange}
                          placeholder="City, State/Country (e.g. Los Angeles, CA)"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50 transition-colors"
                        />
                      </div>
                      {errors.birthLocation && <p className="text-red-400 text-xs mt-1">{errors.birthLocation}</p>}
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Email (to save your chart)</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50 transition-colors"
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-purple-900/30 border-t-purple-900 rounded-full animate-spin"></div>
                          Calculating Your Chart...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate My Free Chart
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <p className="text-white/40 text-xs text-center">
                      By clicking above, you agree to receive occasional cosmic insights. 
                      Unsubscribe anytime. Your data is never shared.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">What You\'ll Discover</h2>
              <p className="text-white/60">Your complete astrological profile decoded</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <feature.icon className="w-8 h-8 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/50 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">What People Are Saying</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-white/60">4.9/5 from 2,800+ reviews</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-4 leading-relaxed">&quot;{t.text}&quot;</p>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-white/50">{t.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Is this really free?",
                  a: "Yes! Your birth chart wheel and basic interpretation are completely free. We also offer premium deep-dive reports for those who want more detailed insights.",
                },
                {
                  q: "How accurate is the birth chart?",
                  a: "We use professional-grade astrological calculations based on your exact birth time and location. The chart wheel is calculated using the Placidus house system, the industry standard.",
                },
                {
                  q: "What if I don\'t know my exact birth time?",
                  a: "You can still generate a chart with an approximate time (e.g., noon). However, for the most accurate Rising Sign and house placements, an exact birth time is recommended.",
                },
                {
                  q: "Will my data be shared?",
                  a: "Never. Your birth details and email are used only to generate and save your chart. We take privacy seriously and never sell or share personal data.",
                },
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-white/60">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Unlock Your Cosmic Blueprint?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Join thousands who have discovered deeper self-understanding through their birth chart.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Get Your Free Chart Now
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-semibold">Cosmic Spirit Guide</span>
            </div>
            <div className="flex items-center gap-6 text-white/50 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-white/30 text-sm">© 2025 Cosmic Spirit Guide. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
