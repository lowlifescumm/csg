"use client";
import { Shield, Lock, Award, Users, Star, RefreshCw, CreditCard, CheckCircle } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and never shared with third parties"
    },
    {
      icon: Lock,
      title: "SSL Encrypted",
      description: "Bank-level 256-bit encryption on all transactions"
    },
    {
      icon: Award,
      title: "Accurate Readings",
      description: "AI-powered insights using verified astrological data"
    },
    {
      icon: Users,
      title: "10,000+ Happy Users",
      description: "Join our growing community of spiritual seekers"
    },
    {
      icon: Star,
      title: "4.8/5 Average Rating",
      description: "Based on 2,000+ verified customer reviews"
    },
    {
      icon: RefreshCw,
      title: "Cancel Anytime",
      description: "No commitments. Easy cancellation with one click"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 border-y border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Trust Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Trusted by Thousands of Seekers
          </h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Your cosmic journey deserves the highest standards of security and accuracy
          </p>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {badges.map((badge, index) => (
            <div 
              key={index}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/20 mb-3 group-hover:from-purple-500/50 group-hover:to-pink-500/50 transition-all">
                <badge.icon className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{badge.title}</h3>
              <p className="text-purple-300 text-xs leading-relaxed">{badge.description}</p>
            </div>
          ))}
        </div>

        {/* Payment Security */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-purple-900">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#635BFF"/>
                    <path d="M8.5 14.5v-5l2.5 2.5 2.5-2.5v5" stroke="white" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-purple-900">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#EB001B"/>
                    <circle cx="12" cy="12" r="10" fill="#F79E1B" fillOpacity="0.8"/>
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-purple-900">
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <rect width="24" height="24" rx="4" fill="#016FD0"/>
                    <path d="M8 8h8v8H8z" fill="white"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold">Secure Payment Processing</p>
                <p className="text-purple-300 text-sm">We accept all major credit cards via Stripe</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-purple-200">
                <CreditCard className="w-4 h-4 text-green-400" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <RefreshCw className="w-4 h-4 text-green-400" />
                <span>30-Day Credits Rollover</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-6 py-3 border border-white/20">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-white font-semibold">4.8/5</span>
            <span className="text-purple-300">from 2,000+ reviews</span>
          </div>
          <p className="text-purple-300 text-sm mt-4">
            "The most accurate readings I've ever received. Worth every penny!" — Sarah M.
          </p>
        </div>
      </div>
    </section>
  );
}
