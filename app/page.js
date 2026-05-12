"use client";

export const dynamic = 'force-static';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Star, Heart, Check, Zap, Eye, Lock, Moon, Sun, ChevronRight, Flame, Compass, Orbit } from "lucide-react";
import FreeSampleModal from "@/components/FreeSampleModal";
/* ─── Cosmic Background Canvas ─── */
function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, stars = [];
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < 300; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.8 + 0.3,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.005
        });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    let anim;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Deep space gradient
      const grad = ctx.createRadialGradient(w/2, h/3, 0, w/2, h/2, w);
      grad.addColorStop(0, '#1a0f3c');
      grad.addColorStop(0.5, '#0d0625');
      grad.addColorStop(1, '#050214');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Nebula clouds
      ctx.globalAlpha = 0.08;
      const nebulaGrad = ctx.createRadialGradient(w*0.3, h*0.4, 0, w*0.3, h*0.4, w*0.4);
      nebulaGrad.addColorStop(0, '#7c3aed');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, w, h);

      const nebulaGrad2 = ctx.createRadialGradient(w*0.7, h*0.6, 0, w*0.7, h*0.6, w*0.3);
      nebulaGrad2.addColorStop(0, '#4c1d95');
      nebulaGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad2;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 1;
      // Stars
      stars.forEach(s => {
        s.alpha += s.speed;
        const a = 0.3 + Math.abs(Math.sin(s.alpha)) * 0.7;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 220, 255, ${a})`;
        ctx.fill();
      });
      anim = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
}

/* ─── Zodiac Constellation SVG ─── */
function ZodiacConstellation({ className = "" }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8d5ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#e8d5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Constellation lines */}
      <path d="M200 60 L260 140 L200 220 L140 140 Z" stroke="rgba(180,160,255,0.3)" strokeWidth="1" />
      <path d="M200 220 L200 320" stroke="rgba(180,160,255,0.3)" strokeWidth="1" />
      <path d="M260 140 L340 120" stroke="rgba(180,160,255,0.2)" strokeWidth="0.5" />
      <path d="M140 140 L60 160" stroke="rgba(180,160,255,0.2)" strokeWidth="0.5" />
      <path d="M200 60 L200 20" stroke="rgba(180,160,255,0.2)" strokeWidth="0.5" />
      {/* Stars */}
      <circle cx="200" cy="60" r="4" fill="url(#starGlow)" />
      <circle cx="200" cy="60" r="1.5" fill="#fff" />
      <circle cx="260" cy="140" r="3" fill="url(#starGlow)" />
      <circle cx="260" cy="140" r="1" fill="#fff" />
      <circle cx="200" cy="220" r="5" fill="url(#starGlow)" />
      <circle cx="200" cy="220" r="2" fill="#fff" />
      <circle cx="140" cy="140" r="3" fill="url(#starGlow)" />
      <circle cx="140" cy="140" r="1" fill="#fff" />
      <circle cx="200" cy="320" r="4" fill="url(#starGlow)" />
      <circle cx="200" cy="320" r="1.5" fill="#fff" />
      {/* Outer ring decorations */}
      <circle cx="200" cy="200" r="160" stroke="rgba(120,80,200,0.15)" strokeWidth="0.5" strokeDasharray="4 8" />
      <circle cx="200" cy="200" r="180" stroke="rgba(120,80,200,0.1)" strokeWidth="0.3" />
    </svg>
  );
}

/* ─── Planet Orb Element ─── */
function PlanetOrb({ color = "#7c3aed", size = 120, glow = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40"
          style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
        />
      )}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}dd 0%, ${color}66 50%, #1a0f3c 100%)`,
          boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.5), 0 0 30px ${color}44`
        }}
      >
        {/* Surface texture lines */}
        <div className="absolute inset-0 opacity-20" style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)`
        }} />
        {/* Highlight */}
        <div className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full opacity-30 blur-md" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent)' }} />
      </div>
    </div>
  );
}

/* ─── Section Divider ─── */
function CosmicDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-cosmic-violet to-transparent" />
      <Star className="w-4 h-4 text-cosmic-violet" />
      <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-cosmic-violet to-transparent" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSampleModal, setShowSampleModal] = useState(false);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { if (user) router.push("/dashboard"); }, [user, router]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (e) { logger.error("Auth check failed"); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cosmic-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-void text-white relative overflow-x-hidden">
      <StarField />

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8">
        {/* Background zodiac constellation */}
        <div className="absolute right-0 top-1/4 w-[500px] h-[500px] opacity-40 pointer-events-none hidden lg:block">
          <ZodiacConstellation className="w-full h-full animate-[spin_120s_linear_infinite]" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10 py-20">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 mb-6">
              <Sparkles className="w-4 h-4 text-cosmic-gold" />
              <span className="text-sm text-cosmic-lavender">AI-Powered Spiritual Guidance</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-white">Unlock Your</span>
              <br />
              <span className="bg-gradient-to-r from-cosmic-gold via-cosmic-violet to-cosmic-rose bg-clip-text text-transparent">
                Cosmic Destiny
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-cosmic-lavender/70 mb-8 max-w-xl mx-auto lg:mx-0">
              Personalized tarot readings, birth charts, and spiritual guidance
              powered by ancient wisdom and advanced AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button
                onClick={() => setShowSampleModal(true)}
                className="px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-cosmic-gold to-amber-500 text-cosmic-void hover:shadow-lg hover:shadow-cosmic-gold/25 transition-all duration-300 hover:scale-105"
              >
                ✨ Free Tarot Reading
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 rounded-xl font-semibold text-lg border border-cosmic-violet/40 text-cosmic-lavender hover:bg-cosmic-violet/10 transition-all duration-300"
              >
                Explore Services →
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm">
              <div className="flex items-center gap-2 text-cosmic-lavender/80">
                <Check className="w-4 h-4 text-cosmic-gold" />
                <span>50,000+ Readings</span>
              </div>
              <div className="flex items-center gap-2 text-cosmic-lavender/80">
                <Check className="w-4 h-4 text-cosmic-gold" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2 text-cosmic-lavender/80">
                <Check className="w-4 h-4 text-cosmic-gold" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Central orb */}
              <PlanetOrb color="#7c3aed" size={280} />
              {/* Orbiting elements */}
              <div className="absolute -top-8 -right-8">
                <PlanetOrb color="#d4af37" size={60} />
              </div>
              <div className="absolute -bottom-4 -left-12">
                <PlanetOrb color="#c45b7a" size={80} />
              </div>
              <div className="absolute top-1/2 -right-16">
                <PlanetOrb color="#5b8a8a" size={50} />
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 -m-20 rounded-full border border-cosmic-violet/20 animate-[spin_20s_linear_infinite]" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(124,58,237,0.1), transparent)'
              }} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cosmic-lavender/70">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-cosmic-violet to-transparent" />
        </div>
      </section>

      <CosmicDivider />

      {/* ─── SERVICES SECTION ─── */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cosmic-gold text-sm font-medium tracking-widest uppercase">Our Services</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4">
              Mystical Guidance for
              <span className="text-cosmic-gold"> Every Journey</span>
            </h2>
            <p className="text-cosmic-lavender/80 text-lg max-w-2xl mx-auto">
              From daily tarot insights to deep birth chart analysis, discover tools designed to illuminate your path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "AI Tarot Readings", desc: "3-card spreads with personalized interpretations based on your energy and intention.", color: "#7c3aed" },
              { icon: Sun, title: "Birth Charts", desc: "Complete natal analysis revealing your cosmic blueprint and life purpose.", color: "#d4af37" },
              { icon: Heart, title: "Compatibility", desc: "Synastry readings to understand relationship dynamics and soul connections.", color: "#c45b7a" },
              { icon: Moon, title: "Moon Phases", desc: "Lunar guidance aligned with your personal cycles and manifestation power.", color: "#5b8a8a" },
              { icon: Compass, title: "Transit Forecasts", desc: "Planetary movement predictions to navigate upcoming cosmic shifts.", color: "#7c3aed" },
              { icon: Eye, title: "Spirit Guide Chat", desc: "Conversational AI that channels wisdom tailored to your unique journey.", color: "#d4af37" },
            ].map((service, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl border border-cosmic-violet/20 bg-cosmic-void/60 backdrop-blur-sm hover:border-cosmic-violet/50 transition-all duration-500 hover:-translate-y-1"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${service.color}22, transparent 70%)` }}
                />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${service.color}22`, border: `1px solid ${service.color}44` }}
                  >
                    <service.icon className="w-6 h-6" style={{ color: service.color }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{service.title}</h3>
                  <p className="text-cosmic-lavender/80 leading-relaxed">{service.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium" style={{ color: service.color }}>
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CosmicDivider />

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cosmic-gold text-sm font-medium tracking-widest uppercase">The Process</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4">
              Three Steps to
              <span className="text-cosmic-gold"> Cosmic Clarity</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines (desktop) */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-px bg-gradient-to-r from-cosmic-violet via-cosmic-gold to-cosmic-violet" />

            {[
              { num: "01", icon: Flame, title: "Set Your Intention", desc: "Choose a focus area — love, career, purpose, or simply ask the universe for guidance." },
              { num: "02", icon: Orbit, title: "Cosmic Analysis", desc: "Our AI interprets tarot spreads, planetary positions, and energy patterns in real-time." },
              { num: "03", icon: Star, title: "Receive Wisdom", desc: "Get a detailed, personalized reading with actionable insights delivered instantly." },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 rounded-full border border-cosmic-violet/30 bg-cosmic-void/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 relative z-10">
                  <step.icon className="w-8 h-8 text-cosmic-gold" />
                </div>
                <div className="text-5xl font-bold text-cosmic-violet/50 mb-2">{step.num}</div>
                <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
                <p className="text-cosmic-lavender/80">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS / SOCIAL PROOF ─── */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cosmic-void via-cosmic-indigo/30 to-cosmic-void">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cosmic-gold text-sm font-medium tracking-widest uppercase">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4">
              Trusted by <span className="text-cosmic-gold">50,000+</span> Seekers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", role: "Daily User", text: "The birth chart reading was shockingly accurate. It helped me understand my career blocks in a whole new way.", rating: 5 },
              { name: "James K.", role: "Spiritual Practitioner", text: "I've used many tarot apps. The AI interpretations here feel genuinely intuitive — not generic at all.", rating: 5 },
              { name: "Elena R.", role: "New to Astrology", text: "The free 3-card reading hooked me. The guidance about my relationship was exactly what I needed to hear.", rating: 5 },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-cosmic-violet/20 bg-cosmic-void/40 backdrop-blur-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-cosmic-gold text-cosmic-gold" />
                  ))}
                </div>
                <p className="text-cosmic-lavender/80 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-violet to-cosmic-rose flex items-center justify-center text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="text-sm text-cosmic-lavender/80">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID (DARK SECTION) ─── */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-cosmic-violet/20 bg-cosmic-indigo/20 backdrop-blur-sm p-8 sm:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-cosmic-gold text-sm font-medium tracking-widest uppercase">Why Choose Us</span>
                <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-6">
                  Precision Meets
                  <span className="text-cosmic-gold"> Mystical Intuition</span>
                </h2>
                <p className="text-cosmic-lavender/80 text-lg mb-8">
                  We combine ancient divination systems with state-of-the-art AI to deliver readings that feel personal, accurate, and actionable.
                </p>

                <div className="space-y-4">
                  {[
                    "Real-time planetary transit tracking",
                    "Personalized card interpretations",
                    "Birth chart with house system analysis",
                    "Moon phase manifestation timing",
                    "Relationship synastry reports",
                    "Encrypted, private readings",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-cosmic-gold/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-cosmic-gold" />
                      </div>
                      <span className="text-cosmic-lavender/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="relative">
                  <ZodiacConstellation className="w-80 h-80 opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlanetOrb color="#d4af37" size={140} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 mb-8">
            <Sparkles className="w-4 h-4 text-cosmic-gold" />
            <span className="text-sm text-cosmic-lavender">Begin Your Journey Today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Your <span className="text-cosmic-gold">Cosmic Guide</span>
            <br />Awaits
          </h2>

          <p className="text-xl text-cosmic-lavender/80 mb-10 max-w-2xl mx-auto">
            The universe has been trying to reach you. Start with a free tarot reading and discover what the stars have planned.
          </p>

          <button
            onClick={() => setShowSampleModal(true)}
            className="px-12 py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-cosmic-gold to-amber-500 text-cosmic-void hover:shadow-xl hover:shadow-cosmic-gold/30 transition-all duration-300 hover:scale-105"
          >
            ✨ Start Free Reading
          </button>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-cosmic-lavender/80">
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-cosmic-gold" /> No credit card</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-cosmic-gold" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-cosmic-gold" /> Private & secure</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-cosmic-violet/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-6 h-6 text-cosmic-gold" />
                <span className="font-bold text-lg">Cosmic Spirit Guide</span>
              </div>
              <p className="text-sm text-cosmic-lavender/80">AI-powered spiritual guidance for modern seekers.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-cosmic-lavender">Services</h4>
              <ul className="space-y-2 text-sm text-cosmic-lavender/80">
                <li><Link href="/tarot" className="hover:text-cosmic-gold transition-colors">Tarot Readings</Link></li>
                <li><Link href="/birth-chart" className="hover:text-cosmic-gold transition-colors">Birth Charts</Link></li>
                <li><Link href="/compatibility" className="hover:text-cosmic-gold transition-colors">Compatibility</Link></li>
                <li><Link href="/horoscope" className="hover:text-cosmic-gold transition-colors">Horoscopes</Link></li>
                <li><Link href="/forecasts" className="hover:text-cosmic-gold transition-colors">Forecasts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-cosmic-lavender">Company</h4>
              <ul className="space-y-2 text-sm text-cosmic-lavender/80">
                <li><Link href="/about" className="hover:text-cosmic-gold transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-cosmic-gold transition-colors">Blog</Link></li>
                <li><Link href="/pricing" className="hover:text-cosmic-gold transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-cosmic-gold transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-cosmic-lavender">Legal</h4>
              <ul className="space-y-2 text-sm text-cosmic-lavender/80">
                <li><Link href="/privacy" className="hover:text-cosmic-gold transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-cosmic-gold transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cosmic-violet/20 pt-8 text-center text-sm text-cosmic-lavender/70">
            © 2024 Cosmic Spirit Guide. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ─── MODAL ─── */}
      <FreeSampleModal isOpen={showSampleModal} onClose={() => setShowSampleModal(false)} />
    </div>
  );
}
