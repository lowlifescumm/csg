"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * useCreditGate Hook
 * 
 * Manages credit checking and paywall state for reading flows.
 * 
 * @param {Object} options
 * @param {number} options.requiredCredits - Number of credits required for the reading
 * @param {string} options.readingType - Type of reading (for analytics/context)
 * @param {boolean} options.requireAuth - Whether user must be logged in (default: true)
 * @param {number} options.bannerDelayMs - Delay before showing floating prompt after banner dismiss (default: 30000)
 * @param {Function} options.onProceed - Callback when user has sufficient credits and proceeds
 * 
 * @returns {Object} Gate state and controls
 */
export function useCreditGate({
  requiredCredits = 0,
  readingType = 'generic',
  requireAuth = true,
  bannerDelayMs = 30000,
  onProceed = null,
}) {
  const router = useRouter();
  
  // Core state
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Gate state
  const [showBanner, setShowBanner] = useState(false);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Check credits and user status on mount
  useEffect(() => {
    checkAccess();
  }, []);
  
  const checkAccess = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check auth
      const authRes = await fetch('/api/auth/user');
      const authData = await authRes.json();
      
      if (!authData.user && requireAuth) {
        setUser(null);
        setCredits(0);
        setShowBanner(true);
        setHasChecked(true);
        setIsLoading(false);
        return;
      }
      
      const currentUser = authData.user;
      setUser(currentUser);
      
      // Admin bypass
      if (currentUser?.role === 'admin') {
        setCredits(Infinity);
        setShowBanner(false);
        setHasChecked(true);
        setIsLoading(false);
        return;
      }
      
      // Check subscription status (subscription = unlimited for most readings)
      const hasSubscription = currentUser?.stripe_subscription_id && 
                             currentUser.stripe_subscription_id.length > 0;
      
      // Get credit balance
      const creditRes = await fetch('/api/credits');
      const creditData = await creditRes.json();
      
      // Calculate available credits
      let availableCredits = 0;
      if (creditData.isPremium && creditData.credits) {
        // Premium users have type-specific credits
        const typeCredits = creditData.credits[readingType];
        availableCredits = typeCredits?.remaining ?? 0;
      } else {
        // Non-premium users have ledger balance
        availableCredits = creditData.credits || 0;
      }
      
      setCredits(availableCredits);
      
      // Determine if gate should show
      // Subscription users with type-specific credits need to check their allocation
      // Non-subscription users need purchased credits
      const hasEnoughCredits = availableCredits >= requiredCredits;
      
      if (!hasEnoughCredits) {
        setShowBanner(true);
      }
      
      setHasChecked(true);
    } catch (err) {
      console.error('Error checking credit access:', err);
      setError('Failed to check credit status');
      setCredits(0);
      setShowBanner(true);
      setHasChecked(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle banner dismiss - show floating prompt after delay
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
    
    // Show floating prompt after delay
    setTimeout(() => {
      setShowFloatingPrompt(true);
    }, bannerDelayMs);
  }, [bannerDelayMs]);
  
  // Handle floating prompt dismiss
  const dismissFloatingPrompt = useCallback(() => {
    setShowFloatingPrompt(false);
  }, []);
  
  // Navigate to credits page
  const goToCredits = useCallback(() => {
    router.push('/credits');
  }, [router]);
  
  // Navigate to subscription page
  const goToSubscription = useCallback(() => {
    router.push('/subscription');
  }, [router]);
  
  // Check if user can proceed
  const canProceed = useCallback(() => {
    if (!hasChecked) return false;
    if (!user && requireAuth) return false;
    if (user?.role === 'admin') return true;
    return credits >= requiredCredits;
  }, [hasChecked, user, credits, requireAuth]);
  
  // Force check again
  const recheck = useCallback(() => {
    checkAccess();
  }, []);
  
  return {
    // State
    user,
    credits,
    isLoading,
    error,
    hasChecked,
    
    // Gate visibility
    showBanner,
    showFloatingPrompt,
    bannerDismissed,
    
    // Computed
    hasEnoughCredits: credits >= requiredCredits,
    isAdmin: user?.role === 'admin',
    isSubscribed: user?.stripe_subscription_id && user.stripe_subscription_id.length > 0,
    canProceed: canProceed(),
    
    // Actions
    dismissBanner,
    dismissFloatingPrompt,
    goToCredits,
    goToSubscription,
    recheck,
    proceed: onProceed,
  };
}

/**
 * usePaywallGate Hook
 * 
 * Simplified hook for pages that need a full paywall gate before showing content.
 * Shows LowCreditsUpsellBanner when credits are insufficient.
 * 
 * @param {number} requiredCredits - Credits needed
 * @param {string} readingType - Reading type key
 * @param {Object} options - Additional options
 */
export function usePaywallGate(requiredCredits, readingType, options = {}) {
  return useCreditGate({
    requiredCredits,
    readingType,
    ...options,
  });
}

export default useCreditGate;
