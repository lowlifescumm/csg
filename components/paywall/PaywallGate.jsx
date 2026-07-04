"use client";

import { Lock } from 'lucide-react';
import Link from 'next/link';

/**
 * PaywallGate Component
 * Shows a modal paywall when credits are insufficient
 */
export default function PaywallGate({ 
  isOpen, 
  onClose, 
  creditsNeeded = 1, 
  creditsRemaining = 0, 
  readingType = "reading" 
}) {
  if (!isOpen) return null;

  const hasSomeCredits = creditsRemaining > 0;
  const needsMore = creditsRemaining < creditsNeeded;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {needsMore ? 'Credits Required' : 'Access Required'}
          </h2>
          
          <p className="text-purple-200 mb-6">
            {needsMore ? (
              <>
                {readingType} requires <span className="font-bold text-white">{creditsNeeded} credits</span>.
                {hasSomeCredits 
                  ? ` You have ${creditsRemaining} credits remaining.`
                  : ' You have no credits remaining.'}
              </>
            ) : (
              <>
                Subscribe or purchase credits to unlock {readingType.toLowerCase()}.
              </>
            )}
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/credits"
              className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all"
            >
              Purchase Credits
            </Link>
            
            <Link 
              href="/subscription"
              className="block w-full bg-white/20 text-white font-bold py-3 rounded-lg hover:bg-white/30 transition-all"
            >
              Subscribe for Unlimited Access
            </Link>
            
            {onClose && (
              <button 
                onClick={onClose}
                className="text-purple-300 hover:text-white transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
