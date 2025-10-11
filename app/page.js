"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Stars, Heart, Users, BookOpen, ChevronRight, Check, Moon, Sun, Calendar } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

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

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    alert("Email signup coming soon! For now, click 'Start Your Free Reading' to create an account.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      <header className="sticky top-0 z-50 glassmorphic border-b border-white border-opacity-20">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Cosmic Spiritual Guide" className="w-10 h-10 object-contain" />
            <span className="text-xl font-semibold gradient-text">Cosmic Spiritual Guide</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/login")} className="text-gray-700 hover:text-purple-600 smooth-transition">
              Log In
            </button>
            <button 
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold smooth-transition hover:shadow-xl hover:scale-105"
            >
              Start Free Reading
            </button>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block float-animation mb-6">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            Discover Your Cosmic Path
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Instant, personalized tarot and astrology insights—crafted for your question and your chart.
          </p>
          
          {/* Floating rating widget */}
          <div className="inline-block mb-6 glassmorphic rounded-full px-6 py-3 border border-purple-200 border-opacity-50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-800">4.9/5</span>
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
              <span className="text-sm text-gray-600 ml-2">Based on 2,847 reviews</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button 
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-105"
            >
              Start Your Free Reading
            </button>
            <button 
              onClick={() => document.getElementById('services').scrollIntoView({behavior: 'smooth'})}
              className="glassmorphic border border-purple-300 text-purple-700 px-8 py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-xl hover:scale-105"
            >
              Explore Services
            </button>
          </div>
          
          {/* Trust badges below CTAs */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🔒</span>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⭐</span>
              <span>10,000+ Happy Users</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>✅</span>
              <span>Accuracy Guaranteed</span>
            </div>
          </div>
          
          {/* Testimonials section in hero */}
          <div className="mt-16">
            <h3 className="text-2xl font-semibold mb-8 text-gray-800">What Our Users Experience</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Testimonial 1 */}
              <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    SM
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Sarah M.</div>
                    <div className="text-sm text-gray-500">Los Angeles</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Stars key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm">
                  "The tarot reading was incredibly accurate. It helped me see the situation with my career change from a new perspective. I made the decision with confidence and haven't looked back since."
                </p>
              </div>
              
              {/* Testimonial 2 */}
              <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    JT
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">James T.</div>
                    <div className="text-sm text-gray-500">New York</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Stars key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm">
                  "My relationship was at a crossroads. The compatibility report showed us our strengths and where we needed work. We're stronger than ever now. This service truly saved our relationship."
                </p>
              </div>
              
              {/* Testimonial 3 */}
              <div className="glassmorphic rounded-2xl p-6 border border-white border-opacity-40 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    EP
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Elena P.</div>
                    <div className="text-sm text-gray-500">Chicago</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Stars key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm">
                  "The premium features are worth every penny. Daily personalized guidance has helped me navigate difficult family dynamics with grace. I finally found the clarity I was seeking for years."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">What We Offer</h2>
            <p className="text-gray-600 text-lg">Human-calibrated interpretations. No fluff.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glassmorphic rounded-3xl p-8 apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-105">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI-Enhanced Tarot Readings</h3>
              <p className="text-gray-600 mb-6">
                Straight answers with compassionate guidance for love, career, and life decisions.
              </p>
              <button 
                onClick={() => router.push("/login")}
                className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 smooth-transition"
              >
                Get Started <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="glassmorphic rounded-3xl p-8 apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-105">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Stars className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Birth Chart Reports</h3>
              <p className="text-gray-600 mb-6">
                Understand your strengths, lessons, and timing through your natal blueprint.
              </p>
              <button 
                onClick={() => router.push("/login")}
                className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 smooth-transition"
              >
                Get My Chart <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="glassmorphic rounded-3xl p-8 apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-105">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Compatibility Readings</h3>
              <p className="text-gray-600 mb-6">
                See how your energies align and where growth is possible.
              </p>
              <button 
                onClick={() => router.push("/login")}
                className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 smooth-transition"
              >
                Check Compatibility <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Get clarity in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Share Your Details</h3>
              <p className="text-gray-600">Ask your question or provide your birth information</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">We Interpret</h3>
              <p className="text-gray-600">Your spread and chart are analyzed with care</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Your Reading</h3>
              <p className="text-gray-600">Receive clear, actionable insights instantly</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-105"
            >
              Get My Reading
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">Why Trust Us</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Thousands of Readings</h3>
              <p className="text-gray-600 text-sm">Delivered with care and accuracy</p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Stars className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">5-Star Feedback</h3>
              <p className="text-gray-600 text-sm">Consistent positive reviews</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Clear Interpretations</h3>
              <p className="text-gray-600 text-sm">No jargon, just clarity</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold mb-2">Private & Confidential</h3>
              <p className="text-gray-600 text-sm">Your information stays safe</p>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-12 max-w-2xl mx-auto">
            We combine years of spiritual wisdom with modern technology to provide insights you can trust and act on.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">What People Say</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Stars key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "It felt personal and spot-on. I made a tough decision with confidence."
              </p>
              <p className="text-sm text-gray-500">— Sarah, CA</p>
            </div>

            <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Stars key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "My birth chart report explained patterns I've felt for years."
              </p>
              <p className="text-sm text-gray-500">— Lucas, UK</p>
            </div>

            <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Stars key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The compatibility reading helped us understand each other better."
              </p>
              <p className="text-sm text-gray-500">— Maya, NYC</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">Featured Articles</h2>
            <p className="text-gray-600">Deepen your spiritual knowledge</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glassmorphic rounded-2xl overflow-hidden apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <Moon className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">What the High Priestess Means in Love</h3>
                <p className="text-gray-600 mb-4">Discover the mysteries of intuition and deep connection in relationships.</p>
                <button className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 smooth-transition">
                  Read more <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="glassmorphic rounded-2xl overflow-hidden apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <Sun className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">Moon Sign: Your Emotional Compass</h3>
                <p className="text-gray-600 mb-4">Learn how your moon sign shapes your emotional world and reactions.</p>
                <button className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 smooth-transition">
                  Read more <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="glassmorphic rounded-2xl overflow-hidden apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">Choosing the Right Tarot Spread</h3>
                <p className="text-gray-600 mb-4">Match your question to the perfect spread for the clearest answers.</p>
                <button className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 smooth-transition">
                  Read more <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-gray-600">
            Ready for your personalized reading? <button onClick={() => router.push("/login")} className="text-purple-600 font-semibold underline">Try it free</button>
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">Common Questions</h2>
          </div>
          
          <div className="space-y-6">
            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer">How accurate are the readings?</summary>
              <p className="mt-4 text-gray-600">Our readings combine traditional tarot and astrology wisdom with AI to provide personalized, meaningful insights. While we can't predict the future, we help you see patterns and possibilities clearly.</p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer">Do I need my exact birth time?</summary>
              <p className="mt-4 text-gray-600">For the most accurate birth chart, yes! But if you don't know it, you can still get valuable insights from your sun and moon signs.</p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer">Is my information private?</summary>
              <p className="mt-4 text-gray-600">Absolutely. We never share your personal details or readings with anyone. Your privacy is sacred to us.</p>
            </details>

            <details className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
              <summary className="font-semibold text-lg cursor-pointer">Can I ask about love, career, or timing?</summary>
              <p className="mt-4 text-gray-600">Yes! Our readings cover all areas of life—love, career, finances, timing, and personal growth. Ask anything that's on your mind.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glassmorphic rounded-3xl p-12 text-center apple-shadow-lg border border-white border-opacity-40">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Free 3-Card Daily Reading</h2>
            <p className="text-gray-600 mb-8">Get personalized daily insight delivered to your inbox every morning</p>
            
            <form onSubmit={handleEmailSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition"
                required
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold smooth-transition hover:shadow-xl hover:scale-105"
              >
                Send Me Daily Insight
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Your clarity is one reading away</h2>
          <p className="text-xl mb-8 text-purple-200">Join thousands who've found their path through the stars</p>
          <button 
            onClick={() => router.push("/login")}
            className="bg-white text-purple-900 px-10 py-4 rounded-2xl font-bold text-lg smooth-transition hover:shadow-2xl hover:scale-105"
          >
            Start Your Free Reading
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                <span className="font-semibold text-white">Cosmic Spiritual Guide</span>
              </div>
              <p className="text-sm text-gray-400">Guided by the stars, powered by insight.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => router.push("/dashboard")} className="hover:text-white smooth-transition">Tarot Readings</button></li>
                <li><button onClick={() => router.push("/birth-chart")} className="hover:text-white smooth-transition">Birth Charts</button></li>
                <li><button onClick={() => router.push("/compatibility")} className="hover:text-white smooth-transition">Compatibility</button></li>
                <li><button onClick={() => router.push("/moon-reading")} className="hover:text-white smooth-transition">Moon Readings</button></li>
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
            <p>&copy; 2025 Cosmic Spiritual Guide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
