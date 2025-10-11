"use client";
import { useState } from "react";

export default function TarotReader() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          spreadType: "three-card",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReading(data.reading);
      } else {
        alert(data.error || "No credits available");
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {!reading ? (
        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 smooth-transition max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block float-animation">
              <svg className="w-16 h-16 mx-auto mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold gradient-text mb-2">Begin Your Journey</h2>
            <p className="text-gray-600">Ask a question and let the cards reveal their wisdom</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-5 rounded-2xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition resize-none text-gray-900 placeholder-gray-400 bg-white bg-opacity-70 apple-shadow"
                rows={5}
                placeholder="What guidance do you seek today?"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-5 rounded-2xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow-lg text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Consulting the cards...
                </span>
              ) : (
                "Draw Cards"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-semibold text-gray-900">Your Reading</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Just now
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {reading.cards.map((card, i) => (
                <div 
                  key={i} 
                  className="group"
                  style={{
                    animation: `fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.2}s both`
                  }}
                >
                  <style>{`
                    @keyframes fadeInUp {
                      from {
                        opacity: 0;
                        transform: translateY(30px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                  <div className="bg-white rounded-2xl p-4 apple-shadow smooth-transition card-hover">
                    <div className="relative overflow-hidden rounded-xl bg-gray-50">
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className={`w-full h-auto smooth-transition ${card.reversed ? 'rotate-180' : ''}`}
                        loading="lazy"
                      />
                      {card.reversed && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Reversed
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 text-center">
                    <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-2">
                      {["Past", "Present", "Future"][i]}
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{card.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-8 border border-purple-100 apple-shadow">
              <div className="flex items-start gap-3 mb-4">
                <svg className="w-6 h-6 text-purple-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-3 text-xl">Interpretation</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{reading.interpretation}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setReading(null)}
            className="w-full max-w-md mx-auto block glassmorphic border-2 border-gray-300 border-opacity-30 text-gray-900 py-4 rounded-2xl font-semibold smooth-transition hover:bg-white hover:bg-opacity-60 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] apple-shadow"
          >
            New Reading
          </button>
        </div>
      )}
    </div>
  );
}
