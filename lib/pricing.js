/**
 * Centralized Pricing Configuration
 * Single source of truth for all pricing in the application
 *
 * Value ladder (what the /pricing page shows):
 *   Free → Starter ($4.99 one-time) → Unlimited ($19.99/mo) → Premium ($39.99/mo)
 *
 * Legacy tier IDs (MYSTIC_LITE / MYSTIC_PREMIUM) are preserved as aliases
 * for Stripe product metadata and backend compatibility. The public-facing
 * names are "Unlimited" and "Premium".
 */

// Credit pack definitions - Aligned with Stripe API
export const CREDIT_PACKS = {
  FLEX_PACK: {
    name: 'Flex Pack',
    credits: 15,
    priceInCents: 1499, // $14.99 — medium pack
    description: 'Flexible middle-ground pack for regular users',
    mostPopular: false,
  },
  // 15-credit pack for webhook tests and flexible purchases (B4/B5 fix)
  MINI_PACK: {
    name: 'Mini Pack',
    credits: 15,
    priceInCents: 1499, // $14.99
    description: 'Quick top-up pack',
    mostPopular: false,
  },
  STARTER: {
    name: 'Starter',
    credits: 5,
    priceInCents: 499, // $4.99 — entry-level one-time pack
    description: 'Dip your toes in — a few deeper readings on demand',
    mostPopular: false,
  },
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
  NATAL_CHART: 5,              // Birth Chart - NOW PAID (was free, revenue fix)
  BIRTH_CHART: 5,             // Alias for NATAL_CHART
  COMPATIBILITY_REPORT: 20,    // Two-chart comparative report
  TRANSIT_FORECAST_SHORT: 8,   // Short transit forecast
  TRANSIT_FORECAST_EXTENDED: 10, // Extended transit forecast
  TRANSIT_TRACKING: 8,         // Default to short forecast
  DAILY_WEEKLY_FORECAST: 8,    // Default to short forecast
  DAILY_HOROSCOPE: 0,          // Free
};

// Free credit allocations
export const FREE_CREDITS = {
  SIGNUP: 1,
  DAILY_REFRESH: 1,
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

// Unified value ladder — the single source of truth for the /pricing page.
// Free → Starter (one-time) → Unlimited ($19.99/mo) → Premium ($39.99/mo)
export const PRICING_TIERS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    priceInCents: 0,
    cadence: 'forever',
    creditsPerMonth: 1, // daily-refresh free credits (REDUCED from 3 to 1)
    rolloverDays: 1,
    reportDiscountPercent: 0,
    priorityAccess: false,
    mostPopular: false,
    description: 'Test what speaks to you',
    includes: [
      '1 free credit every day', // UPDATED
      'Daily horoscope',
      'Birth chart (5 credits)',
    ],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    priceInCents: 499, // $4.99 one-time
    cadence: 'one-time',
    creditsPerMonth: 5,
    rolloverDays: null, // permanent credits
    reportDiscountPercent: 0,
    priorityAccess: false,
    mostPopular: false,
    description: 'Dip your toes in',
    includes: [
      '5 permanent credits',
      'All reading types',
      'Credits never expire',
    ],
  },
  UNLIMITED: {
    id: 'UNLIMITED',
    name: 'Unlimited',
    priceInCents: 1999, // $19.99/mo
    cadence: 'month',
    creditsPerMonth: 60,
    rolloverDays: 90,
    reportDiscountPercent: 5,
    priorityAccess: false,
    mostPopular: true,
    description: 'For the regular seeker',
    includes: [
      '60 credits / month',
      '90-day rollover',
      'All reading types',
      '5% discount on reports',
    ],
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium',
    priceInCents: 3999, // $39.99/mo
    cadence: 'month',
    creditsPerMonth: 150,
    rolloverDays: 180,
    reportDiscountPercent: 10,
    priorityAccess: true,
    mostPopular: false,
    description: 'For the devoted mystic',
    includes: [
      '150 credits / month',
      '180-day rollover',
      'Priority queue',
      '10% discount on reports',
      'Seasonal premium readings',
      'Extended forecasts & timelines',
    ],
  },
};

// Legacy subscription tier definitions (kept for Stripe metadata + backend compat).
// The public-facing names are PRICING_TIERS.UNLIMITED / PREMIUM.
export const SUBSCRIPTION_TIERS = {
  MYSTIC_LITE: {
    id: 'MYSTIC_LITE',
    name: 'Unlimited',
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
    name: 'Premium',
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
    name: 'Premium',
    priceInCents: 3999,
    creditsPerMonth: 150,
    rolloverDays: 180,
    reportDiscountPercent: 10,
    priorityAccess: true,
  },
  BASIC: {
    id: 'MYSTIC_LITE',
    name: 'Unlimited',
    priceInCents: 1999,
    creditsPerMonth: 60,
    rolloverDays: 90,
    reportDiscountPercent: 5,
    priorityAccess: false,
  },
};

// Map public tier IDs (UNLIMITED/PREMIUM) to legacy subscription IDs (MYSTIC_LITE/MYSTIC_PREMIUM)
export function resolveSubscriptionTierId(tierId) {
  if (!tierId) return 'MYSTIC_LITE';
  const upper = tierId.toUpperCase();
  if (upper === 'UNLIMITED') return 'MYSTIC_LITE';
  if (upper === 'PREMIUM') return 'MYSTIC_PREMIUM';
  if (upper === 'STARTER' || upper === 'FREE') return null; // not subscription tiers
  return upper; // already a legacy ID like MYSTIC_LITE
}

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

