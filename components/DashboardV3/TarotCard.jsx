"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function TarotCard() {
  const [revealed, setRevealed] = useState(false);
  
  return (
    <>
      <style jsx>{`
        .tarot-card-container {
          min-height: 260px;
        }

        .tarot-thumbnail {
          width: 200px;
          height: 200px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
          flex-shrink: 0;
          transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .tarot-thumbnail:hover {
          transform: scale(1.05) rotateY(5deg);
          box-shadow: 0 12px 32px rgba(168, 107, 255, 0.4);
        }
      `}</style>
      <Card size="lg" className="tarot-card-container">
        <div className="flex items-center gap-6 h-full">
          {/* Left: Card Thumbnail */}
          <button
            type="button"
            className="tarot-thumbnail flex items-center justify-center cursor-pointer smooth-transition hover:scale-[1.02] hover:shadow-soft"
            onClick={() => setRevealed(!revealed)}
            aria-label={revealed ? "Tarot card revealed: The Star" : "Click to reveal your daily tarot card"}
          >
            {!revealed ? (
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-white mx-auto mb-2" aria-hidden="true" />
                <p className="text-white font-medium text-sm">Click to reveal</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-white font-semibold text-lg">The Star</p>
                <p className="text-white/80 text-sm mt-2">Hope guides you</p>
              </div>
            )}
          </button>

          {/* Right: Text Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-semibold text-xl mb-2">Your Daily Guidance</h3>
              <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
                Click the card to reveal your message from the universe...
              </p>
            </div>
            <Link
              href="/dashboard#tarot-section"
              className="inline-flex items-center px-4 py-2 border rounded-xl smooth-transition text-sm"
              style={{ 
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--accent-1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent-1)';
                e.target.style.backgroundColor = 'rgba(255, 93, 180, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Draw New Card
            </Link>
          </div>
        </div>
      </Card>
    </>
  );
}

