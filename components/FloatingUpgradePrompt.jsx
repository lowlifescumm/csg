"use client";
import { useEffect, useState } from 'react';
import { Crown, X } from 'lucide-react';
import Link from 'next/link';

const FloatingUpgradePrompt = ({ message = "Out of credits! Upgrade for unlimited access", autoHide = true, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show with animation
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 50);

    // Auto-hide after duration
    if (autoHide) {
      const hideTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(hideTimer);
    }
  }, [autoHide, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-8 right-8 z-50 
        max-w-sm w-full mx-4
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'}
      `}
    >
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-2xl shadow-2xl p-1">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-base">Premium Required</h4>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-200 text-sm mb-4">{message}</p>
          
          <Link 
            href="/subscription"
            className="block w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-2.5 rounded-xl text-center hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>

      {/* Progress bar showing auto-hide timer */}
      {autoHide && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @media (max-width: 640px) {
          .fixed {
            bottom: 20px;
            right: 20px;
            left: 20px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingUpgradePrompt;