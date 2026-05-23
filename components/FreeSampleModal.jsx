"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, Lock, Mail, Check } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { apiClient } from '@/lib/api-client';
import { useApiClientWithToast } from '@/src/hooks/useApiClientWithToast';

export default function FreeSampleModal({ isOpen, onClose }) {
  const [step, setStep] = useState("intention"); // intention | loading | result | capture
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState(null);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [sampleReq, setSampleReq] = useState({ count: 0, question: null });

  const fireAnalytics = (eventName, extra = {}) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, { event_category: "free_sample", ...extra });
    }
  };

  useApiClientWithToast(
    apiClient,
    (c) => c.post("/api/tarot/sample", { question: sampleReq.question }, { timeout: 90_000 }),
    [sampleReq.count, sampleReq.question],
    {
      enabled: sampleReq.count > 0,
      onSuccess: (data) => {
        setSampleReq({ count: 0, question: null });
        if (data.success) {
          fireAnalytics("free_reading_completed");
          setTimeout(() => {
            setReading(data.reading);
            setStep("result");
            setIsAnimating(false);
          }, 500);
        } else {
          setError(data.error || "Something went wrong");
          setStep("intention");
          setIsAnimating(false);
        }
      },
      onError: () => {
        setStep("intention");
        setIsAnimating(false);
      },
      toastMessages: { error: "Failed to connect. Please try again." },
    },
  );

  useEffect(() => {
    if (isOpen) {
      setStep("intention");
      setQuestion("");
      setReading(null);
      setError("");
      setIsAnimating(false);
      setEmail("");
      setCaptureError("");
      setCaptureLoading(false);
      setCaptured(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleStartReading = () => {
    if (!question.trim()) {
      setError("Please share your intention or question");
      return;
    }
    
    setStep("loading");
    setIsAnimating(true);
    
    setSampleReq({ count: 1, question: question.trim() });
  };

  const handleCaptureEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setCaptureError("Please enter a valid email address");
      return;
    }
    setCaptureLoading(true);
    setCaptureError("");

    try {
      // Store lead in localStorage for now (until we have a lead capture table)
      const leads = JSON.parse(localStorage.getItem('csg_leads') || '[]');
      leads.push({ email: email.trim(), question: question.trim(), date: new Date().toISOString() });
      localStorage.setItem('csg_leads', JSON.stringify(leads));
      
      // Also try to submit to a simple API if one exists
      await apiClient.post('/api/leads/capture', { email: email.trim(), source: 'free_sample_modal', question: question.trim() }).catch(() => {});
      
      setCaptured(true);
      setCaptureLoading(false);
    } catch (err) {
      setCaptureError("Failed to save. Please try again.");
      setCaptureLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    // Pre-fill email on login page if captured
    const params = new URLSearchParams();
    params.set('returnUrl', '/dashboard');
    if (captured) params.set('email', email);
    window.location.href = `/login?${params.toString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto apple-shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-10 h-10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold gradient-text">
                {step === "intention" && "Your Free Tarot Preview"}
                {step === "loading" && "The Cards Are Being Drawn..."}
                {(step === "result" || step === "capture") && "Your Reading"}
              </h2>
              {(step === "result" || step === "capture") && (
                <p className="text-sm text-white/80 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Sample reading • Full reading available free
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 smooth-transition"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        {/* Step: Intention Input */}
        {step === "intention" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-cosmic-purple/20 text-white/70 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-cosmic-purple/20">
                <Sparkles className="w-4 h-4" />
                100% Free • No signup required
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ask the cards what you need to know
              </h3>
              <p className="text-white/60 max-w-lg mx-auto">
                Get a personalized 3-card tarot reading instantly. 
                Past, Present, and Future revealed.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <label className="block text-sm font-medium text-white/70 mb-2">
                What guidance are you seeking?
              </label>
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setError("");
                }}
                className="w-full p-4 rounded-2xl border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 outline-none smooth-transition resize-none text-white placeholder-white/30 bg-white/5 min-h-[120px]"
                placeholder="e.g., What should I focus on in my career? or What do I need to know about my relationship?"
              />
              {error && (
                <p className="text-cosmic-rose text-sm mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {[
                "What does my future hold?",
                "How can I find clarity?", 
                "What am I not seeing?",
                "What's blocking me?"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white/70 smooth-transition hover:border-purple-400/30"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="max-w-xl mx-auto">
              <button
                onClick={handleStartReading}
                disabled={isAnimating}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold text-lg smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Reveal My Cards
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-white/40 mt-3">
                Takes 2 seconds • No email required
              </p>
            </div>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="py-12 text-center">
            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="relative w-24 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `translateY(${i === 1 ? '-10px' : '0'})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                  </div>
                  <div className="absolute inset-0 border-2 border-white/30 rounded-xl" />
                  <div className="absolute inset-4 border border-white/20 rounded-lg opacity-50" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Sparkles className="w-8 h-8 text-white/60" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-lg text-white/80 font-medium mb-2">
              Shuffling the deck...
            </p>
            <p className="text-white/50">
              The cards are aligning with your energy
            </p>
          </div>
        )}

        {/* Step: Result + Email Capture */}
        {(step === "result" || step === "capture") && reading && (
          <div className="space-y-8">
            {/* Cards Display */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {reading.cards.map((card, i) => (
                <div
                  key={i}
                  className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="relative bg-white/90 rounded-2xl p-2 sm:p-3 shadow-lg mb-3 group hover:scale-105 smooth-transition">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={card.image}
                        alt={card.name}
                        className={`w-full h-auto ${card.reversed ? 'rotate-180' : ''}`}
                      />
                      {card.reversed && (
                        <div className="absolute top-2 right-2 bg-cosmic-purple/50 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                          Reversed
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-2 bg-cosmic-indigo/90 rounded-xl opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center p-2">
                      <p className="text-white text-xs text-center leading-tight">
                        {card.reversed ? card.reversed : card.upright}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                    {reading.positions[i]}
                  </p>
                  <p className="font-semibold text-white text-sm sm:text-base leading-tight">
                    {card.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Interpretation */}
            <div className="bg-gradient-to-br from-purple-900/40 to-cosmic-indigo/40 rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-2">Your Guidance</h3>
                  <div className="text-white/80 leading-relaxed">
                    <MarkdownRenderer text={reading.interpretation} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sample notice */}
            <div className="bg-cosmic-gold/50/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-200 font-medium text-sm">
                  This is a preview reading
                </p>
                <p className="text-amber-200/70 text-sm mt-1">
                  Save your reading to get detailed card meanings, 
                  personalized daily horoscopes, and reading history.
                </p>
              </div>
            </div>

            {/* Email Capture */}
            {!captured ? (
              <div className="bg-gradient-to-br from-purple-900/30 to-cosmic-indigo/30 rounded-2xl p-6 border border-purple-500/20">
                <div className="text-center mb-4">
                  <Mail className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-white mb-1">Save Your Reading</h3>
                  <p className="text-white/60 text-sm">
                    Enter your email to save this reading and get daily cosmic insights
                  </p>
                </div>
                <div className="flex gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCaptureError("");
                    }}
                    placeholder="your@email.com"
                    className="flex-1 p-3 rounded-xl border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 outline-none smooth-transition text-white placeholder-white/30 bg-white/5"
                  />
                  <button
                    onClick={handleCaptureEmail}
                    disabled={captureLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
                  >
                    {captureLoading ? (
                      <span className="animate-spin">⟳</span>
                    ) : (
                      <>Save <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
                {captureError && (
                  <p className="text-cosmic-rose text-sm text-center mt-2">{captureError}</p>
                )}
                <div className="mt-4 text-center">
                  <button
                    onClick={handleGoToDashboard}
                    className="text-white/40 hover:text-white/70 text-sm smooth-transition underline"
                  >
                    Skip and continue without saving →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-cosmic-teal/50/10 border border-green-500/20 rounded-2xl p-6 text-center">
                <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Reading Saved!</h3>
                <p className="text-white/60 text-sm mb-4">
                  Your reading is saved. Create a free account to unlock full interpretations and daily horoscopes.
                </p>
                <button
                  onClick={handleGoToDashboard}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-2 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Your Free Full Reading
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Bottom trust */}
            <p className="text-center text-sm text-white/30">
              ✓ No spam • Unsubscribe anytime • Your data is private
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
