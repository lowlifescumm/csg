/**
 * Centralized Pricing Configuration
 * Single source of truth for all pricing in the application
 */

// Credit pack definitions
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
    credits: 60,
    priceInCents: 3999, // $39.99
    description: 'Best value for frequent users',
  },
  ORACLE_TIER: {
    name: 'Oracle Tier',
    credits: 150,
    priceInCents: 7999, // $79.99
    description: 'Maximum value pack',
  },
};

// Subscription pricing
export const SUBSCRIPTION = {
  MONTHLY_PRICE_IN_CENTS: 999, // $9.99
  INTERVAL: 'month',
  NAME: 'Transit Dashboard Subscription',
  DESCRIPTION: 'Unlimited access to Transit Dashboard features',
  INCLUDES: [
    'Free Natal Chart (one-time)',
    'Daily/Weekly Forecasts',
    'Transit Tracking',
    'Transit Dashboard',
  ],
};

// Reading credit costs
export const READING_COSTS = {
  TAROT_BASIC: 1,
  TAROT_PREMIUM: 2,
  MOON_PHASE: 1,
  MOON_PERSONALIZED: 2,
  NATAL_CHART: 3,
  TRANSIT_TRACKING: 2,
  DAILY_WEEKLY_FORECAST: 3,
  COMPATIBILITY_REPORT: 5,
  SOULMATE_DEEP_DIVE: 8,
  DAILY_HOROSCOPE: 0,
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
