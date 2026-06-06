"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Heart, ChevronRight, Shield, CheckCircle, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

// Simple tarot card component
function TarotCard({ card, position, onSelect, isSelected, isRevealed }) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer transition-all duration-500 transform
        ${isSelected ? 'scale-110 z-10' : 'scale-100 hover:scale-105'}
      `}
    >
      <div className={`
        w-24 h-40 sm:w-32 sm:h-56 rounded-xl shadow-xl overflow-hidden
        ${isRevealed ? '' : 'bg-gradient-to-br from-violet-800 to-purple-900'}
        border-2 transition-colors duration-300
        ${isSelected ? 'border-amber-400' : 'border-white/20'}
      `}>
        {isRevealed ? (
          <div className="w-full h-full bg-white p-2 flex flex-col">
            <img
              src={card.image || `/tarot-cards/${card.id}.jpg`}
              alt={card.name}
              className="w-full h-3/5 object-cover rounded mb-2"
              onError={(e) => {
                e.target.src = '/tarot-cards/placeholder.jpg';
              }}
            />
            <div className="text-center">
              <p className="text-xs font-bold text-purple-900 truncate">{card.name}</p>
              <p className="text-xs text-gray-600">{card.position}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FreeTarotPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState('intro'); // intro, question, cards, result, save-cta
  const [question, setQuestion] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [reading, setReading] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUsedFreeReading, setHasUsedFreeReading] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if user has already used free reading (localStorage)
    if (typeof window !== 'undefined') {
      const used = localStorage.getItem('csg_free_reading_used');
      const savedReading = localStorage.getItem('csg_free_reading_data');
      
      if (used === 'true') {
        setHasUsedFreeReading(true);
        if (savedReading) {
          try {
            const parsed = JSON.parse(savedReading);
            setReading(parsed);
            setStep('save-cta');
          } catch (e) {
            console.error('Error parsing saved reading:', e);
          }
        }
      }
    }
  }, []);

  const handleStartReading = () => {
    if (hasUsedFreeReading) {
      setError('You have already used your free reading. Please sign up to save unlimited readings!');
      return;
    }
    setStep('question');
  };

  const handleSubmitQuestion = () => {
    if (!question.trim()) {
      setError('Please enter your question');
      return;
    }
    setError('');
    setStep('cards');
    // Auto-generate cards after a brief delay for UX
    setTimeout(() => generateReading(), 500);
  };

  const generateReading = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/free-tarot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          spreadType: 'three-card',
          readingType: 'general'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate reading');
      }

      const data = await response.json();
      
      if (data.success && data.reading) {
        setReading(data.reading);
        setSelectedCards(data.reading.cards);
        
        // Mark free reading as used
        localStorage.setItem('csg_free_reading_used', 'true');
        localStorage.setItem('csg_free_reading_data', JSON.stringify(data.reading));
        
        // Track analytics
        try {
          window.gtag?.('event', 'free_reading_completed', {
            spread_type: 'three-card',
            card_count: data.reading.cards.length
          });
        } catch (e) {}
        
        setStep('result');
        
        // After showing result for a moment, show save CTA
        setTimeout(() => setStep('save-cta'), 1000);
      }
    } catch (err) {
      console.error('Reading error:', err);
      setError(err.message || 'Failed to generate reading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToAccount = () => {
    // Store reading ID in session for claim after signup
    if (reading?.id) {
      sessionStorage.setItem('pending_reading_claim', reading.id);
    }
    router.push('/login?redirect=free-tarot&action=claim');
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
      {/* Celestial Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-1 h-1 bg-white/60 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-amber-400/40 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
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

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="max-w-4xl mx-auto">
            
            {/* Intro Step */}
            {step === 'intro' && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/30 mb-8">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-200 text-sm font-medium">100% Free • No Signup Required</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Your Free Tarot Reading
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400 block mt-2">Awaits</span>
                </h1>

                <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                  Get a personalized 3-card tarot reading instantly. No account needed - just ask your question and receive cosmic guidance.
                </p>

                {/* Features */}
                <div className="grid sm:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
                  <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-white/80 text-sm">3-Card Spread</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-white/80 text-sm">Private & Secure</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white/80 text-sm">AI-Powered</span>
                  </div>
                </div>

                {hasUsedFreeReading ? (
                  <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-8 max-w-xl mx-auto">
                    <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Free Reading Already Used</h3>
                    <p className="text-white/60 mb-6">
                      You have already used your free tarot reading. Sign up to unlock unlimited readings and save your results!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 hover:from-amber-300 hover:to-amber-400 transition-all"
                      >
                        Create Free Account
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartReading}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 hover:from-amber-300 hover:to-amber-400 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Your Free Reading
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}

                {error && (
                  <div className="mt-6 bg-red-500/20 border border-red-400/30 text-red-200 px-6 py-4 rounded-xl max-w-md mx-auto">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Question Step */}
            {step === 'question' && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">What’s on your mind?</h2>
                  <p className="text-white/60">Ask a question or choose an area of focus</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What should I focus on this month? or Just show me what I need to know..."
                    className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50 transition-colors resize-none h-32"
                  />
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Love', 'Career', 'Growth', 'Decision', 'General'].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setQuestion(`Focus on ${topic.toLowerCase()}`)}
                        className="px-3 py-1.5 rounded-full text-sm bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors border border-white/10"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm mt-4">{error}</p>
                  )}

                  <button
                    onClick={handleSubmitQuestion}
                    className="w-full mt-6 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Cards / Loading Step */}
            {(step === 'cards' || (step === 'result' && isLoading)) && (
              <div className="text-center py-12">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  <Sparkles className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Shuffling the Cards...</h2>
                <p className="text-white/60">The universe is preparing your message</p>
              </div>
            )}

            {/* Result Step */}
            {step === 'result' && reading && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your Reading</h2>
                  <p className="text-white/60">{reading.cards.length} cards reveal your path</p>
                </div>

                {/* Cards Display */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                  {reading.cards.map((card, index) => (
                    <TarotCard
                      key={index}
                      card={card}
                      position={card.position}
                      isRevealed={true}
                      isSelected={false}
                    />
                  ))}
                </div>

                {/* Interpretation */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20">
                  <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Your Message
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white/90 whitespace-pre-line leading-relaxed">
                      {reading.interpretation}
                    </p>
                  </div>
                  
                  {reading.summary && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <p className="text-white/70 italic">{reading.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save CTA Step */}
            {step === 'save-cta' && reading && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-amber-400/20 to-purple-400/20 rounded-2xl p-8 sm:p-12 border border-amber-400/30">
                  <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Save Your Reading
                  </h2>
                  <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                    Create a free account to save this reading forever, get unlimited future readings, and access your personal dashboard.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button
                      onClick={handleSaveToAccount}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 hover:from-amber-300 hover:to-amber-400 transition-all hover:scale-105"
                    >
                      <Sparkles className="w-5 h-5" />
                      Save My Reading
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-white/50 text-sm mb-8">
                    Or{' '}
                    <Link href="/pricing" className="text-amber-400 hover:text-amber-300 underline">
                      view subscription plans
                    </Link>
                    {' '}for unlimited readings
                  </div>

                  {/* Benefits */}
                  <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-white/5 rounded-xl p-4 text-left">
                      <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                      <p className="text-white/80 text-sm">Unlimited tarot readings</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-left">
                      <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                      <p className="text-white/80 text-sm">Save & revisit readings</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-left">
                      <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                      <p className="text-white/80 text-sm">Birth chart included</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Simple Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto text-center text-white/40 text-sm">
            <p>© 2025 Cosmic Spirit Guide. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
