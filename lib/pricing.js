/**
 * Centralized Pricing Configuration
 * Single source of truth for all pricing in the application
 */

// Credit pack definitions - Aligned with Stripe API
export const CREDIT_PACKS = {
  CURIOUS_SEEKER: {
    name: 'Curious Seeker',
    credits: 10,
    priceInCents: 999, // $9.99
    description: 'Perfect for trying out readings',
  },
  COSMIC_EXPLORER: {
    name: 'Cosmic Explorer',
    credits: 25,
    priceInCents: 1999, // $19.99
    description: 'Great for regular use',
    mostPopular: true, // Highlight in UI
  },
  STELLAR_CIRCLE: {
    name: 'Stellar Circle',
    credits: 50,
    priceInCents: 3499, // $34.99
    description: 'Best value for frequent users',
  },
  ORACLE_TIER: {
    name: 'Oracle Tier',
    credits: 100,
    priceInCents: 5999, // $59.99
    description: 'Maximum value pack',
  },
};

// Legacy subscription pricing (deprecated - use SUBSCRIPTION_TIERS instead)
export const SUBSCRIPTION = {
  MONTHLY_PRICE_IN_CENTS: 1999, // Default to Mystic Lite
  INTERVAL: 'month',
  NAME: 'Mystic Lite Subscription',
  DESCRIPTION: 'Monthly credits subscription',
  INCLUDES: [
    '60 credits per month',
    '90-day rollover',
    'Access to all reading types',
    '5% discount on reports',
  ],
};

// Reading credit costs
export const READING_COSTS = {
  TAROT_BASIC: 1,              // Standard Tarot only (free credits eligible)
  TAROT_PREMIUM: 3,            // High volume spread (5-7 cards)
  TAROT_CUSTOM: 1,             // Custom spread (1-10 cards) - cost calculated dynamically (1 credit per card)
  MOON_READING: 5,             // Moon Reading - Emotional & energetic insight
  MOON_PHASE: 5,               // Alias for MOON_READING
  MOON_PERSONALIZED: 5,        // Alias for MOON_READING
  NATAL_CHART: 0,              // Birth Chart - NOW FREE (core product)
  BIRTH_CHART: 0,             // Alias for NATAL_CHART
  COMPATIBILITY_REPORT: 20,    // Two-chart comparative report
  TRANSIT_FORECAST_SHORT: 8,   // Short transit forecast
  TRANSIT_FORECAST_EXTENDED: 10, // Extended transit forecast
  TRANSIT_TRACKING: 8,         // Default to short forecast
  DAILY_WEEKLY_FORECAST: 8,    // Default to short forecast
  DAILY_HOROSCOPE: 0,          // Free
};

// Free credit allocations
export const FREE_CREDITS = {
  SIGNUP: 3,
  DAILY_REFRESH: 3,
  EXPIRY_HOURS: 24,
};

// Helper functions
export function getCreditPackByCredits(credits) {
  return Object.values(CREDIT_PACKS).find(pack => pack.credits === credits);
}

export function isValidCreditPack(credits, priceInCents) {
  const pack = getCreditPackByCredits(credits);
  return pack && pack.priceInCents === priceInCents;
}

export function getReadingCost(readingType) {
  return READING_COSTS[readingType] ?? 1; // Default to 1 credit if not found
}

export function canUseFreeCredits(readingType) {
  // Free credits can ONLY be used for basic Tarot
  return readingType === 'TAROT_BASIC';
}

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  MYSTIC_LITE: {
    id: 'MYSTIC_LITE',
    name: 'Mystic Lite',
    priceInCents: 1999, // $19.99/month
    creditsPerMonth: 60,
    rolloverDays: 90,
    reportDiscountPercent: 5,
    priorityAccess: false,
    includes: [
      'Access to all reading types',
      'Standard support',
      '5% discount on reports',
    ],
  },
  MYSTIC_PREMIUM: {
    id: 'MYSTIC_PREMIUM',
    name: 'Mystic Premium',
    priceInCents: 3999, // $39.99/month
    creditsPerMonth: 150,
    rolloverDays: 180,
    reportDiscountPercent: 10,
    priorityAccess: true,
    includes: [
      'Access to all reading types',
      'Priority queue',
      '10% discount on reports',
      'Seasonal premium readings',
      'Extended forecasts & relationship timelines',
    ],
  },
  // Legacy aliases for backwards compatibility
  PREMIUM: {
    id: 'MYSTIC_PREMIUM',
    name: 'Mystic Premium',
    priceInCents: 3999,
    creditsPerMonth: 150,
    rolloverDays: 180,
    reportDiscountPercent: 10,
    priorityAccess: true,
  },
  BASIC: {
    id: 'MYSTIC_LITE',
    name: 'Mystic Lite',
    priceInCents: 1999,
    creditsPerMonth: 60,
    rolloverDays: 90,
    reportDiscountPercent: 5,
    priorityAccess: false,
  },
};

// Direct-Pay Premium Reports (not credit-based)
export const PREMIUM_REPORTS = {
  ESSENTIAL: {
    id: 'ESSENTIAL',
    name: 'Essential Report',
    priceInCents: 4900, // $49
    description: 'Tarot + Moon + short forecast',
    includes: [
      'Premium Tarot reading (5-7 cards)',
      'Moon Reading',
      'Short Transit Forecast',
    ],
    turnaround: '2-4 minutes',
  },
  ADVANCED: {
    id: 'ADVANCED',
    name: 'Advanced Report',
    priceInCents: 14900, // $149
    description: 'Full natal + compatibility + forecast',
    includes: [
      'Complete Birth Chart analysis',
      'Compatibility Report',
      'Extended Transit Forecast',
    ],
    turnaround: '4-6 minutes',
  },
  MASTER: {
    id: 'MASTER',
    name: 'Master Report',
    priceInCents: 24900, // $249
    description: 'Deep-dive multi-cycle destiny profile',
    includes: [
      'Comprehensive Birth Chart',
      'Advanced Compatibility Analysis',
      'Multi-cycle Transit Forecast',
      'Relationship Timeline',
      'Seasonal Premium Readings',
    ],
    turnaround: '6-8 minutes',
  },
};

// Get subscription tier by ID
export function getSubscriptionTierById(tierId) {
  if (!tierId) return null;
  const upperId = tierId.toUpperCase();
  return SUBSCRIPTION_TIERS[upperId] || null;
}

// Get premium report by ID
export function getPremiumReportById(reportId) {
  if (!reportId) return null;
  return PREMIUM_REPORTS[reportId.toUpperCase()] || null;
}

