/**
 * Reading Dependency Matrix
 * Defines required and recommended prerequisites for each reading/report type.
 */

export const DEPENDENCY_MATRIX_VERSION = '2025-11-20';

const PRIMARY_BIRTH_CHART = {
  id: 'PRIMARY_BIRTH_CHART',
  type: 'BIRTH_CHART',
  scope: 'self',
  label: 'Your birth chart',
  message: 'Create your birth chart to unlock this experience.',
  requiresBirthData: true,
};

const PARTNER_BIRTH_CHART = {
  id: 'PARTNER_BIRTH_CHART',
  type: 'PARTNER_BIRTH_CHART',
  scope: 'partner',
  label: "Your partner's birth chart",
  message: 'Add a birth chart for your partner to continue.',
  requiresBirthData: true,
};

const RELATIONSHIP_TAROT_RECOMMENDATION = {
  id: 'RELATIONSHIP_TAROT_CONTEXT',
  type: 'READING_HISTORY',
  label: 'Relationship Insight tarot reading',
  readingType: 'tarot',
  timeframeDays: 30,
  message: 'Add a Relationship Insight reading for richer compatibility guidance.',
  upsell: {
    cta: 'Add Relationship Insight Reading',
    href: '/readings/relationship-insight',
  },
};

const RECENT_TRANSIT_REPORT_RECOMMENDATION = {
  id: 'RECENT_TRANSIT_REPORT',
  type: 'READING_HISTORY',
  label: 'Transit dashboard refresh',
  readingType: 'transit_tracking',
  timeframeDays: 30,
  message: 'Refresh your transit dashboard monthly for the most accurate forecasts.',
  upsell: {
    cta: 'Refresh Transit Dashboard',
    href: '/dashboard/transits',
  },
};

const SELF_CHART_AUTO = {
  ...PRIMARY_BIRTH_CHART,
  autoCreate: true,
  label: 'Auto-generated birth chart',
  message: 'We will generate a birth chart from the info you provide during checkout.',
};

export const READING_DEPENDENCY_MATRIX = {
  TAROT_PREMIUM: {
    required: [],
    recommended: [],
  },
  MOON_PHASE: {
    required: [],
    recommended: [],
  },
  NATAL_CHART: {
    required: [],
    recommended: [],
  },
  TRANSIT_TRACKING: {
    required: [PRIMARY_BIRTH_CHART],
    recommended: [RECENT_TRANSIT_REPORT_RECOMMENDATION],
  },
  DAILY_FORECAST: {
    required: [PRIMARY_BIRTH_CHART],
    recommended: [],
  },
  WEEKLY_FORECAST: {
    required: [PRIMARY_BIRTH_CHART],
    recommended: [],
  },
  DAILY_WEEKLY_FORECAST: {
    required: [PRIMARY_BIRTH_CHART],
    recommended: [],
  },
  COMPATIBILITY_REPORT: {
    required: [PRIMARY_BIRTH_CHART, PARTNER_BIRTH_CHART],
    recommended: [RELATIONSHIP_TAROT_RECOMMENDATION],
  },
  REPORT_FULL_NATAL: {
    required: [SELF_CHART_AUTO],
    recommended: [],
    autoFulfillRequired: true,
  },
  REPORT_LIFE_PURPOSE: {
    required: [SELF_CHART_AUTO],
    recommended: [],
    autoFulfillRequired: true,
  },
};

export const AUTO_FULFILL_READING_TYPES = new Set(
  Object.entries(READING_DEPENDENCY_MATRIX)
    .filter(([, config]) => config.autoFulfillRequired)
    .map(([readingType]) => readingType),
);
