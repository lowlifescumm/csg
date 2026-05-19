/**
 * Page metadata helpers
 * Centralized metadata definitions for static and dynamic pages
 */

export const PAGE_METADATA = {
  advancedReport: {
    title: 'Advanced Report — Birth Chart & Compatibility | Cosmic Spirit Guide',
    description:
      'Unlock your complete birth chart analysis, compatibility report, and extended transit forecast. The Advanced Report delivers deep astrological insights in a premium PDF.',
    canonical: '/reports/advanced',
    openGraph: {
      title: 'Advanced Report — Complete Birth Chart & Compatibility',
      description:
        'Complete birth chart analysis, relationship compatibility, and extended transit forecast. Personalized by AI, delivered as a premium PDF.',
      url: '/reports/advanced',
      type: 'website',
    },
  },
  masterReport: {
    title: 'Master Report — Complete Cosmic Blueprint | Cosmic Spirit Guide',
    description:
      'Our most comprehensive astrological reading: 50+ pages covering birth chart, advanced compatibility, multi-cycle transits, relationship timeline, and destiny path synthesis.',
    canonical: '/reports/master',
    openGraph: {
      title: 'Master Report — The Complete Cosmic Blueprint',
      description:
        '50+ pages of master-level astrological insight: birth chart, compatibility, transits, relationship timeline, and destiny path. A private consultation in PDF form.',
      url: '/reports/master',
      type: 'website',
    },
  },
};

/**
 * Generate Next.js metadata object from a page metadata definition
 */
export function generatePageMetadata(definition) {
  return {
    title: definition.title,
    description: definition.description,
    alternates: {
      canonical: definition.canonical,
    },
    openGraph: definition.openGraph,
  };
}
