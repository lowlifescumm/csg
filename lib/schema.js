import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

/**
 * Generate JSON-LD structured data for homepage
 * Combines Service, SoftwareApplication, Organization, and FAQPage schemas
 */
export function generateHomePageSchema() {
    const baseUrl = 'https://cosmicspiritguide.com';

    return {
        '@context': 'https://schema.org',
        '@graph': [
            // Primary Service Schema
            {
                '@type': 'Service',
                '@id': `${baseUrl}/#service`,
                'name': 'AI Tarot Readings & Astrology',
                'description': 'AI-powered tarot readings and astrology insights providing personalized spiritual guidance',
                'provider': {
                    '@id': `${baseUrl}/#organization`
                },
                'serviceType': 'Spiritual Guidance',
                'areaServed': 'Worldwide',
                'hasOfferCatalog': {
                    '@type': 'OfferCatalog',
                    'name': 'Spiritual Services',
                    'itemListElement': [
                        {
                            '@type': 'Offer',
                            'itemOffered': {
                                '@type': 'Service',
                                'name': 'AI Tarot Reading',
                                'description': 'Personalized tarot card readings powered by AI'
                            }
                        },
                        {
                            '@type': 'Offer',
                            'itemOffered': {
                                '@type': 'Service',
                                'name': 'Birth Chart Analysis',
                                'description': 'Detailed astrological birth chart interpretation'
                            }
                        },
                        {
                            '@type': 'Offer',
                            'itemOffered': {
                                '@type': 'Service',
                                'name': 'Compatibility Report',
                                'description': 'Relationship compatibility analysis using astrology'
                            }
                        }
                    ]
                }
            },

            // SoftwareApplication Schema (AI Platform)
            {
                '@type': 'SoftwareApplication',
                '@id': `${baseUrl}/#software`,
                'name': 'Cosmic Spirit Guide',
                'applicationCategory': 'LifestyleApplication',
                'operatingSystem': 'Web Browser',
                'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD',
                    'description': '3 free credits daily'
                },
                'aggregateRating': {
                    '@type': 'AggregateRating',
                    'ratingValue': '4.8',
                    'ratingCount': '1250',
                    'bestRating': '5',
                    'worstRating': '1'
                }
            },

            // Organization Schema
            {
                '@type': 'Organization',
                '@id': `${baseUrl}/#organization`,
                'name': 'Cosmic Spirit Guide',
                'url': baseUrl,
                'logo': {
                    '@type': 'ImageObject',
                    'url': `${baseUrl}/CSG_LOGO.svg`
                },
                'sameAs': [
                    'https://twitter.com/cosmicspiritguide'
                ],
                'contactPoint': {
                    '@type': 'ContactPoint',
                    'contactType': 'Customer Support',
                    'url': `${baseUrl}/contact`
                }
            },

            // FAQPage Schema
            {
                '@type': 'FAQPage',
                '@id': `${baseUrl}/#faq`,
                'mainEntity': [
                    {
                        '@type': 'Question',
                        'name': 'Is this AI or spiritual?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'It\'s a blend. The readings come from an AI system trained on tarot, archetypes, and spiritual interpretation. The goal is clarity, empowerment, and emotional resonance.'
                        }
                    },
                    {
                        '@type': 'Question',
                        'name': 'How personalized are the readings?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'Each reading responds to your intention, your situation, and the energy you bring at that moment.'
                        }
                    },
                    {
                        '@type': 'Question',
                        'name': 'Do I really get 3 free credits daily?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'Yes. Every day your account refreshes automatically — no card required.'
                        }
                    },
                    {
                        '@type': 'Question',
                        'name': 'How fast do I receive the reading?',
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': 'Instantly. No waiting, no appointments.'
                        }
                    }
                ]
            }
        ]
    };
}
