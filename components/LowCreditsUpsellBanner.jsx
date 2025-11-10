"use client";
import { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

/**
 * A banner that appears when a user is low on credits, encouraging them to upgrade.
 * @param {object} props - The component props.
 * @param {string} [props.creditType='all'] - The type of credit being checked.
 * @param {number} [props.creditsNeeded=1] - The number of credits needed for an action.
 * @param {number} [props.currentCredits=0] - The user's current credit balance.
 * @param {boolean} [props.forceShow=false] - Whether to force the banner to show, regardless of dismissal state.
 * @returns {JSX.Element|null} The LowCreditsUpsellBanner component, or null if not visible.
 */
const LowCreditsUpsellBanner = ({ creditType = 'all', creditsNeeded = 1, currentCredits = 0, forceShow = false }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('upsell-banner-dismissed');
    if (!dismissed || forceShow) {
      setIsVisible(true);
      setTimeout(() => setAnimateIn(true), 100);
    }
  }, [forceShow]);

  /**
   * Dismisses the banner and stores the dismissal state in session storage.
   */
  const handleDismiss = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setIsDismissed(true);
      setIsVisible(false);
      sessionStorage.setItem('upsell-banner-dismissed', 'true');
    }, 300);
  };

  if (isDismissed || !isVisible) return null;
  if (!forceShow && currentCredits >= creditsNeeded) return null;

  /**
   * Gets the appropriate message to display based on the user's credit balance.
   * @returns {{title: string, subtitle: string, urgency: string}} The message object.
   */
  const getMessage = () => {
    if (currentCredits === 0) {
      return {
        title: "No credits remaining!",
        subtitle: "Upgrade to Premium to continue your cosmic journey",
        urgency: "high"
      };
    } else if (currentCredits === 1) {
      return {
        title: "Last credit available!",
        subtitle: "Use it wisely or upgrade for 8 monthly credits",
        urgency: "medium"
      };
    } else if (currentCredits < 3) {
      return {
        title: "Running low on credits!",
        subtitle: "Upgrade to Premium for 8 monthly credits",
        urgency: "low"
      };
    }
    return {
      title: "Unlock Premium Features",
      subtitle: "Get 8 monthly credits with Premium membership",
      urgency: "low"
    };
  };

  const { title, subtitle, urgency } = getMessage();

  const gradientStyles = {
    high: 'from-orange-500 via-red-500 to-pink-500',
    medium: 'from-yellow-500 via-orange-500 to-amber-500',
    low: 'from-amber-400 via-yellow-400 to-orange-400'
  };

  const bgOpacity = {
    high: 'bg-opacity-95',
    medium: 'bg-opacity-90',
    low: 'bg-opacity-85'
  };

  return (
    <div 
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50 
        max-w-2xl w-full mx-4 px-6 py-4 rounded-2xl
        bg-gradient-to-r ${gradientStyles[urgency]} ${bgOpacity[urgency]}
        shadow-2xl backdrop-blur-sm border border-white border-opacity-30
        transform transition-all duration-300 ease-out
        ${animateIn ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              {title}
              {urgency === 'high' && <TrendingUp className="w-5 h-5 animate-bounce" />}
            </h3>
            <p className="text-sm text-white text-opacity-90">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/subscription"
            className="px-6 py-2.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
          >
            Upgrade Now
          </Link>
          <button
            onClick={handleDismiss}
            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .fixed {
            top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default LowCreditsUpsellBanner;
