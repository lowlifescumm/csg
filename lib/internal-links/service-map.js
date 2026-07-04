/**
 * Internal Linking Service Map
 * Maps content themes to relevant services/tools for SEO internal linking
 */

export const SERVICE_ROUTES = {
  TAROT: '/tarot',
  BIRTH_CHART: '/birth-chart',
  COMPATIBILITY: '/compatibility',
  MOON_READING: '/moon-reading',
  TRANSITS: '/transits',
  FORECASTS: '/forecasts',
  DASHBOARD: '/dashboard',
  PRICING: '/pricing',
  SUBSCRIPTION: '/pricing', // legacy alias — /subscription now 307-redirects to /pricing
  CREDITS: '/credits',
};

// Keyword mapping for contextual auto-linking in blog content
export const KEYWORD_TO_SERVICE = {
  // Tarot related
  'tarot': { route: '/tarot', label: 'Get a Tarot Reading', priority: 1 },
  'tarot cards': { route: '/tarot', label: 'Tarot Reading', priority: 1 },
  'card reading': { route: '/tarot', label: 'Tarot Card Reading', priority: 2 },
  'card spread': { route: '/tarot', label: 'Explore Tarot Spreads', priority: 2 },
  
  // Birth chart / astrology related
  'birth chart': { route: '/birth-chart', label: 'Get Your Free Birth Chart', priority: 1 },
  'natal chart': { route: '/birth-chart', label: 'Free Natal Chart', priority: 1 },
  'astrology chart': { route: '/birth-chart', label: 'Create Your Astrology Chart', priority: 1 },
  'zodiac sign': { route: '/birth-chart', label: 'Discover Your Zodiac', priority: 2 },
  'sun sign': { route: '/birth-chart', label: 'Calculate Your Sun Sign', priority: 2 },
  'moon sign': { route: '/birth-chart', label: 'Find Your Moon Sign', priority: 2 },
  'rising sign': { route: '/birth-chart', label: 'Calculate Your Rising Sign', priority: 2 },
  'horoscope': { route: '/birth-chart', label: 'Get Your Personal Horoscope', priority: 2 },
  'planetary alignment': { route: '/birth-chart', label: 'Explore Planetary Alignments', priority: 2 },
  
  // Compatibility related
  'compatibility': { route: '/compatibility', label: 'Check Compatibility', priority: 1 },
  'relationship compatibility': { route: '/compatibility', label: 'Love Compatibility Report', priority: 1 },
  'love match': { route: '/compatibility', label: 'Find Your Love Match', priority: 1 },
  'synastry': { route: '/compatibility', label: 'Get Synastry Reading', priority: 1 },
  'relationship reading': { route: '/compatibility', label: 'Relationship Reading', priority: 2 },
  'soulmate': { route: '/compatibility', label: 'Soulmate Compatibility', priority: 2 },
  'partner': { route: '/compatibility', label: 'Partner Compatibility', priority: 2 },
  
  // Moon related
  'moon': { route: '/moon-reading', label: 'Get Moon Reading', priority: 2 },
  'moon phase': { route: '/moon-reading', label: 'Moon Phase Reading', priority: 1 },
  'lunar': { route: '/moon-reading', label: 'Lunar Reading', priority: 1 },
  'moon cycle': { route: '/moon-reading', label: 'Moon Cycle Reading', priority: 2 },
  'full moon': { route: '/moon-reading', label: 'Full Moon Reading', priority: 2 },
  'new moon': { route: '/moon-reading', label: 'New Moon Reading', priority: 2 },
  
  // Transit/forecast related
  'transit': { route: '/transits', label: 'Check Your Transits', priority: 1 },
  'transit forecast': { route: '/transits', label: 'Transit Forecast', priority: 1 },
  'forecast': { route: '/forecasts', label: 'Get Your Forecast', priority: 1 },
  'prediction': { route: '/forecasts', label: 'Personal Predictions', priority: 2 },
  'future reading': { route: '/forecasts', label: 'Future Reading', priority: 2 },
  'upcoming events': { route: '/forecasts', label: 'Upcoming Events', priority: 2 },
  
  // Spiritual tools
  'meditation': { route: '/dashboard', label: 'Guided Meditations', priority: 2 },
  'spiritual guidance': { route: '/dashboard', label: 'Spiritual Guidance', priority: 2 },
  'cosmic guidance': { route: '/dashboard', label: 'Get Cosmic Guidance', priority: 2 },
  'intention': { route: '/tarot', label: 'Set Your Intention', priority: 2 },
  
  // Upgrades / pricing
  'credits': { route: '/credits', label: 'Purchase Credits', priority: 2 },
  'premium': { route: '/pricing', label: 'Upgrade to Premium', priority: 2 },
  'subscription': { route: '/pricing', label: 'Start Subscription', priority: 2 },
  'membership': { route: '/pricing', label: 'Membership', priority: 2 },
};

// Category to service mapping for related content
export const CATEGORY_TO_SERVICES = {
  'tarot': [
    { route: '/tarot', label: 'Try a Tarot Reading', description: 'Get personalized card guidance for any question' },
    { route: '/dashboard', label: 'Daily Tarot', description: 'Your daily spiritual guidance' },
  ],
  'astrology': [
    { route: '/birth-chart', label: 'Free Birth Chart', description: 'Discover your cosmic blueprint - completely free' },
    { route: '/compatibility', label: 'Compatibility Report', description: 'Compare charts with a partner' },
    { route: '/transits', label: 'Transit Forecast', description: 'See what the planets have in store' },
  ],
  'birth-charts': [
    { route: '/birth-chart', label: 'Create Your Chart', description: 'Free personalized birth chart analysis' },
    { route: '/my-chart', label: 'View Your Chart', description: 'See your saved chart data' },
  ],
  'compatibility': [
    { route: '/compatibility', label: 'Check Compatibility', description: 'See how your energies align' },
    { route: '/birth-chart', label: 'Birth Chart First', description: 'Start with your free chart' },
  ],
  'moon': [
    { route: '/moon-reading', label: 'Moon Phase Reading', description: 'Understand lunar influences on your energy' },
    { route: '/forecasts', label: 'Moon Forecast', description: 'Upcoming lunar events for your sign' },
  ],
  'forecasts': [
    { route: '/forecasts', label: 'Personal Forecast', description: 'Custom predictions based on your chart' },
    { route: '/transits', label: 'Transit Analysis', description: 'Track planetary movements' },
  ],
  'spiritual-growth': [
    { route: '/dashboard', label: 'Daily Practice', description: 'Build your spiritual routine' },
    { route: '/journal', label: 'Spiritual Journal', description: 'Track your insights and growth' },
  ],
  'relationships': [
    { route: '/compatibility', label: 'Compatibility Reading', description: 'Understand your relationship dynamics' },
    { route: '/tarot', label: 'Love Tarot', description: 'Get guidance on love and relationships' },
  ],
  'general': [
    { route: '/tarot', label: 'Daily Tarot', description: 'Start with a free tarot reading' },
    { route: '/birth-chart', label: 'Birth Chart', description: 'Discover your cosmic blueprint' },
    { route: '/services', label: 'All Services', description: 'Explore all our spiritual tools' },
  ],
};

// Tag to service mapping (for related content)
export const TAG_TO_SERVICE = {
  'tarot': '/tarot',
  'birth-chart': '/birth-chart',
  'astrology': '/birth-chart',
  'compatibility': '/compatibility',
  'love': '/compatibility',
  'relationships': '/compatibility',
  'moon': '/moon-reading',
  'lunar': '/moon-reading',
  'transits': '/transits',
  'forecast': '/forecasts',
  'prediction': '/forecasts',
  'spiritual': '/dashboard',
  'meditation': '/dashboard',
  'guidance': '/dashboard',
};

// Service to related services mapping (cross-linking)
export const SERVICE_RELATED_LINKS = {
  '/birth-chart': [
    { route: '/compatibility', label: 'Check Compatibility', description: 'See how your chart aligns with others' },
    { route: '/transits', label: 'Transit Forecast', description: 'What\'s happening in your chart now' },
    { route: '/forecasts', label: 'Personal Forecast', description: 'Predictions based on your birth chart' },
  ],
  '/tarot': [
    { route: '/moon-reading', label: 'Moon Reading', description: 'Add lunar energy to your tarot practice' },
    { route: '/dashboard', label: 'Daily Practice', description: 'Make tarot part of your daily routine' },
  ],
  '/compatibility': [
    { route: '/birth-chart', label: 'Birth Charts First', description: 'Both partners need charts for best results' },
    { route: '/tarot', label: 'Relationship Tarot', description: 'Tarot insights for your relationship' },
  ],
  '/moon-reading': [
    { route: '/tarot', label: 'Tarot with Moon', description: 'Combine moon phases with tarot' },
    { route: '/forecasts', label: 'Moon Forecasts', description: 'Upcoming lunar events' },
  ],
  '/transits': [
    { route: '/birth-chart', label: 'Your Birth Chart', description: 'Transits are based on your natal chart' },
    { route: '/forecasts', label: 'Full Forecast', description: 'Complete picture of upcoming energies' },
  ],
  '/forecasts': [
    { route: '/transits', label: 'Transit Details', description: 'Deep dive into planetary movements' },
    { route: '/birth-chart', label: 'Chart Required', description: 'Forecasts need your birth chart data' },
  ],
};

// Helper function to get services for a category
export function getServicesForCategory(category) {
  const normalizedCategory = category?.toLowerCase().trim() || 'general';
  return CATEGORY_TO_SERVICES[normalizedCategory] || CATEGORY_TO_SERVICES['general'];
}

// Helper function to get services for a tag
export function getServicesForTag(tag) {
  const normalizedTag = tag?.toLowerCase().trim();
  const route = TAG_TO_SERVICE[normalizedTag];
  if (!route) return null;
  
  // Find the matching service info
  for (const [cat, services] of Object.entries(CATEGORY_TO_SERVICES)) {
    const service = services.find(s => s.route === route);
    if (service) return service;
  }
  return null;
}

// Helper function to get related services for a service page
export function getRelatedServices(currentPath) {
  return SERVICE_RELATED_LINKS[currentPath] || [];
}

// Helper to extract keywords from content and suggest links
export function extractKeywordLinks(content, maxLinks = 3) {
  if (!content) return [];
  const contentLower = content.toLowerCase();
  const matches = [];
  
  for (const [keyword, service] of Object.entries(KEYWORD_TO_SERVICE)) {
    if (contentLower.includes(keyword.toLowerCase())) {
      matches.push({
        keyword,
        ...service,
        index: contentLower.indexOf(keyword.toLowerCase()),
      });
    }
  }
  
  // Sort by priority first, then by position in content
  matches.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.index - b.index;
  });
  
  // Return unique routes only
  const seenRoutes = new Set();
  return matches.filter(m => {
    if (seenRoutes.has(m.route)) return false;
    seenRoutes.add(m.route);
    return true;
  }).slice(0, maxLinks);
}
