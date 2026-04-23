const PREREQUISITE_LINKS = {
  PRIMARY_BIRTH_CHART: {
    label: 'Create your birth chart',
    href: '/dashboard/birth-chart',
  },
  PARTNER_BIRTH_CHART: {
    label: 'Add partner birth data',
    href: '/dashboard/compatibility',
  },
};

const BASE_READING_CONFIG = {
  premium_tarot: {
    cost: 3,
    dependencyType: 'TAROT_PREMIUM',
    queue: 'tarot',
  },
  moon_reading: {
    cost: 5,
    dependencyType: 'MOON_PHASE',
    queue: 'moon',
  },
  birth_chart: {
    cost: 0,
    dependencyType: 'NATAL_CHART',
    queue: 'birth-chart',
  },
  compatibility: {
    cost: 20,
    dependencyType: 'COMPATIBILITY_REPORT',
    queue: 'compatibility',
  },
  transit_forecast_short: {
    cost: 8,
    dependencyType: 'TRANSIT_TRACKING',
    queue: 'transit',
  },
  transit_forecast_extended: {
    cost: 10,
    dependencyType: 'TRANSIT_TRACKING',
    queue: 'transit',
  },
};

function resolveTransitVariant(options = {}) {
  const mode = (options.mode || options.variant || options.length || '').toString().toLowerCase();
  return mode === 'extended' || mode === 'long' ? 'transit_forecast_extended' : 'transit_forecast_short';
}

export function getReadingRequestConfig(readingType, options = {}) {
  if (!readingType) return null;

  if (readingType === 'transit_forecast') {
    const key = resolveTransitVariant(options);
    return { ...BASE_READING_CONFIG[key], key };
  }

  const config = BASE_READING_CONFIG[readingType];
  if (!config) return null;
  return { ...config, key: readingType };
}

export function buildValidatorContext(readingTypeConfig, options = {}) {
  const context = {};

  if (options.partner_user_id || options.partnerUserId) {
    context.partnerUserId = options.partner_user_id || options.partnerUserId;
  }
  if (options.partner_chart_id || options.partnerChartId) {
    context.partnerChartId = options.partner_chart_id || options.partnerChartId;
  }
  if (options.birth_data || options.birthData) {
    context.birthData = options.birth_data || options.birthData;
  }
  if (options.partner_birth_data || options.partnerBirthData) {
    context.partnerBirthData = options.partner_birth_data || options.partnerBirthData;
  }

  return context;
}

export function attachPrerequisiteLinks(items = []) {
  return (items || []).map(item => ({
    ...item,
    action: PREREQUISITE_LINKS[item.id] || null,
  }));
}
