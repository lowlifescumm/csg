/**
 * Metadata utility for consistent SEO meta tags across all pages
 */

const SITE_NAME = "Cosmic Spiritual Guide";
const SITE_URL = "https://cosmicspiritguide.com";
const DEFAULT_IMAGE = `${SITE_URL}/CSG_LOGO.svg`;
const DEFAULT_DESCRIPTION = "Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance.";

/**
 * Generate metadata object for a page
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.path - Page path (e.g., '/services')
 * @param {string} options.image - OG image URL (optional)
 * @param {string} options.type - OG type (default: 'website')
 * @param {Array<string>} options.keywords - SEO keywords (optional)
 */
export function generatePageMetadata({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = []
}) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  
  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@cosmicspiritguide',
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Page-specific metadata configurations
 */
export const PAGE_METADATA = {
  home: {
    title: "Cosmic Spiritual Guide - Tarot & Astrology Insights",
    description: "Get instant, personalized tarot and astrology insights. AI-enhanced readings for love, career, and life guidance. 3 free credits every day.",
    path: "/",
    keywords: ["tarot", "astrology", "birth chart", "horoscope", "spiritual guidance", "tarot reading", "astrology reading"],
  },
  services: {
    title: "Services - Tarot Readings & Astrology",
    description: "Explore our comprehensive spiritual services: tarot readings, birth charts, compatibility reports, moon readings, and transit forecasts.",
    path: "/services",
    keywords: ["tarot services", "astrology services", "birth chart", "compatibility", "moon reading", "transit forecast"],
  },
  blog: {
    title: "Spiritual Blog - Astrology & Tarot Insights",
    description: "Discover insights into astrology, tarot, spirituality, and cosmic guidance through our expert articles and spiritual teachings.",
    path: "/blog",
    keywords: ["spiritual blog", "astrology blog", "tarot blog", "spiritual guidance", "cosmic insights"],
  },
  login: {
    title: "Login - Cosmic Spiritual Guide",
    description: "Sign in to your Cosmic Spiritual Guide account to access personalized tarot readings, birth charts, and spiritual insights.",
    path: "/login",
    keywords: ["login", "sign in", "account"],
  },
  dashboard: {
    title: "Dashboard - Your Cosmic Journey",
    description: "Access your personalized dashboard with tarot readings, birth charts, daily forecasts, and spiritual insights.",
    path: "/dashboard",
    keywords: ["dashboard", "my readings", "spiritual dashboard"],
  },
  credits: {
    title: "Purchase Credits - Cosmic Spiritual Guide",
    description: "Purchase credits to unlock premium tarot readings, birth chart interpretations, compatibility reports, and more.",
    path: "/credits",
    keywords: ["credits", "purchase credits", "buy credits", "tarot credits"],
  },
  subscription: {
    title: "Premium Subscription - Unlimited Access",
    description: "Upgrade to Premium for unlimited access to all features. Starting at $19.99/month with 60 credits included.",
    path: "/subscription",
    keywords: ["premium", "subscription", "unlimited access", "mystic lite", "mystic premium"],
  },
  birthChart: {
    title: "Birth Chart - Free Natal Chart Generator",
    description: "Generate your free birth chart instantly. View your astrological chart wheel and unlock full interpretation for 12 credits.",
    path: "/birth-chart",
    keywords: ["birth chart", "natal chart", "astrology chart", "free birth chart"],
  },
  compatibility: {
    title: "Compatibility Report - Relationship Analysis",
    description: "Discover your relationship compatibility through detailed astrological analysis. Compare birth charts for deep insights.",
    path: "/compatibility",
    keywords: ["compatibility", "relationship compatibility", "synastry", "relationship analysis"],
  },
  moonReading: {
    title: "Moon Reading - Personalized Lunar Guidance",
    description: "Get personalized moon phase readings with emotional insights and energetic guidance based on your birth chart.",
    path: "/moon-reading",
    keywords: ["moon reading", "moon phase", "lunar guidance", "moon astrology"],
  },
  transits: {
    title: "Transit Dashboard - Current Astrological Transits",
    description: "Track current astrological transits affecting your birth chart. Get personalized transit forecasts and insights.",
    path: "/transits",
    keywords: ["transits", "astrological transits", "transit forecast", "current transits"],
  },
  privacy: {
    title: "Privacy Policy - Cosmic Spiritual Guide",
    description: "Read our privacy policy to understand how we collect, use, and protect your personal information.",
    path: "/privacy",
    keywords: ["privacy policy", "data protection", "privacy"],
  },
  terms: {
    title: "Terms of Service - Cosmic Spiritual Guide",
    description: "Review our terms of service to understand the rules and regulations for using Cosmic Spiritual Guide.",
    path: "/terms",
    keywords: ["terms of service", "terms and conditions", "user agreement"],
  },
  contact: {
    title: "Contact Us - Cosmic Spiritual Guide",
    description: "Get in touch with Cosmic Spiritual Guide. We're here to help with questions, support, and feedback.",
    path: "/contact",
    keywords: ["contact", "support", "help", "customer service"],
  },
  about: {
    title: "About Us - Cosmic Spiritual Guide",
    description: "Learn about Cosmic Spiritual Guide, our mission to provide personalized spiritual guidance through AI-enhanced tarot and astrology.",
    path: "/about",
    keywords: ["about", "about us", "mission", "spiritual guidance"],
  },
  pricing: {
    title: "Pricing - Credit Packs & Subscriptions",
    description: "View our pricing for credit packs and premium subscriptions. Choose the plan that works best for your spiritual journey.",
    path: "/pricing",
    keywords: ["pricing", "plans", "credit packs", "subscription pricing"],
  },
};

