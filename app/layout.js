import "./globals.css";
import { Inter, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import Header from "@/components/Header";
import ToastContainerWrapper from "@/components/ui/ToastContainerWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientErrorCatcher from "@/components/ClientErrorCatcher";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

// Next.js 15 requires viewport to be exported separately from metadata
export const viewport = {
  themeColor: "#050214",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Free Tarot Reading & Birth Chart Calculator | Cosmic Spirit Guide",
  titleTemplate: "%s | Cosmic Spirit Guide",
  description:
    "Get your free daily tarot reading and personalized birth chart. AI-powered astrology insights, compatibility tests, and spiritual guidance. No signup required for your first reading.",
  keywords: [
    "free tarot reading",
    "birth chart calculator",
    "natal chart calculator",
    "astrology compatibility test",
    "daily horoscope",
    "spiritual guidance",
    "love compatibility",
    "zodiac compatibility",
    "moon phase calculator",
    "free astrology reading",
  ],
  authors: [{ name: "Cosmic Spirit Guide" }],
  creator: "Cosmic Spirit Guide",
  publisher: "Cosmic Spirit Guide",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cosmicspiritguide.com",
    siteName: "Cosmic Spirit Guide",
    title: "Cosmic Spirit Guide — Free Tarot & Astrology Readings",
    description:
      "Get instant, personalized tarot and astrology insights. Plus a free birth chart calculator — no signup required.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Cosmic Spirit Guide — Free Tarot Readings & Astrology",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmic Spirit Guide — Free Tarot & Astrology",
    description: "Get instant, personalized tarot and astrology insights.",
    images: ["/logos/csg-logo-og.jpg"],
    creator: "@cosmicspiritguide",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logos/csg-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/logos/csg-icon-192.png", sizes: "192x192", type: "image/png" }],
    other: [
      {
        rel: "apple-touch-icon",
        url: "/logos/csg-icon-192.png",
      },
    ],
  },
  manifest: "/manifest.json",
};

// Schema.org JSON-LD structured data
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Cosmic Spirit Guide's tarot reading really free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You get a free daily tarot reading with 5 credits refreshed every 24 hours. No credit card or signup required for standard readings."
      }
    },
    {
      "@type": "Question",
      "name": "How accurate is the AI tarot reading?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our AI combines traditional tarot card meanings with personalized context from your question to provide insightful guidance. While not a substitute for professional advice, users report meaningful resonance with their situations."
      }
    },
    {
      "@type": "Question",
      "name": "What's included in the free birth chart?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your free birth chart includes your Sun sign, Moon sign, Rising sign (Ascendant), and planetary placements. It provides insights into your personality, emotions, and life path based on your birth date, time, and location."
      }
    },
    {
      "@type": "Question",
      "name": "How do credits work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Free users receive 5 credits daily that refresh every 24 hours. Premium readings require more credits. You can purchase credit packs or subscribe monthly for more readings and rollover credits."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between standard and premium tarot?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard tarot uses 3 cards for quick guidance. Premium tarot uses 5-7 cards with deeper analysis, 7-day guidance, and an energy summary for a more comprehensive reading."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get a compatibility reading with anyone?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You can generate compatibility reports for any relationship—romantic, friendship, family, or professional. Just enter both people's birth details for a detailed astrological comparison."
      }
    }
  ]
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Spiritual Guidance & Astrology Readings",
  "provider": {
    "@type": "Organization",
    "name": "Cosmic Spirit Guide",
    "url": "https://cosmicspiritguide.com"
  },
  "areaServed": {
    "@type": "Place",
    "name": "Global Online Service"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Tarot & Astrology Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Standard Tarot Reading",
          "description": "3-card spread for daily guidance"
        },
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Premium Tarot Reading",
          "description": "5-7 card spread with 7-day guidance and energy summary"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Birth Chart Calculator",
          "description": "Complete natal chart with Sun, Moon, Rising, and planetary placements"
        },
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Compatibility Report",
          "description": "Two-chart comparative analysis for relationship dynamics"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Moon Reading",
          "description": "Current moon phase influence and emotional guidance"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Transit Forecast",
          "description": "Weekly or monthly astrological forecast based on current planetary transits"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1250",
    "bestRating": "5",
    "worstRating": "1"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cosmic Spirit Guide",
  alternateName: "CSG",
  url: "https://cosmicspiritguide.com",
  logo: {
    "@type": "ImageObject",
    url: "https://cosmicspiritguide.com/logos/csg-logo-primary.svg",
    width: 600,
    height: 180,
    caption: "Cosmic Spirit Guide Logo",
  },
  image: {
    "@type": "ImageObject",
    url: "https://cosmicspiritguide.com/logos/csg-logo-og.jpg",
    width: 1200,
    height: 630,
  },
  description:
    "AI-powered tarot readings, birth charts, and astrology insights. Get personalized spiritual guidance instantly.",
  sameAs: ["https://twitter.com/cosmicspiritguide"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@cosmicspiritguide.com",
    availableLanguage: "English",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://cosmicspiritguide.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cosmic Spirit Guide",
  url: "https://cosmicspiritguide.com",
  publisher: {
    "@type": "Organization",
    name: "Cosmic Spirit Guide",
    logo: {
      "@type": "ImageObject",
      url: "https://cosmicspiritguide.com/logos/csg-logo-primary.svg",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${playfair.variable} scroll-smooth`}>
      <head>
        {/* Preload primary logo for LCP optimization */}
        <link
          rel="preload"
          href="/logos/csg-logo-primary.svg"
          as="image"
          type="image/svg+xml"
        />

        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema, faqSchema, serviceSchema]),
          }}
        />
      </head>

      <body
        className="min-h-screen bg-cosmic-void antialiased"
        suppressHydrationWarning={true}
      >
        <AuthProviderWrapper>
          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-T0J78R09VN"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-T0J78R09VN');
            `}
          </Script>

          <Header />

          {/* Responsive padding for fixed header */}
          <div className="pt-16 sm:pt-20 md:pt-[80px]"></div>

          <main id="main-content" className="flex-1">
            <ErrorBoundary>
              <div className="w-full">{children}</div>
            </ErrorBoundary>
          </main>

          <footer className="bg-cosmic-indigo text-white/80 border-t border-white/10 py-8 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-white/60 font-light tracking-wide">
                  Powered by AI • Tarot • Horoscopes • Birth Charts
                </p>
                <p className="mt-2 text-xs text-white/40">
                  © {new Date().getFullYear()} Cosmic Spirit Guide
                </p>
                <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
                  <a href="/privacy" className="text-xs sm:text-sm text-white/50 hover:text-white/80 transition-colors">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-xs sm:text-sm text-white/50 hover:text-white/80 transition-colors">
                    Terms of Service
                  </a>
                  <a href="/contact" className="text-xs sm:text-sm text-white/50 hover:text-white/80 transition-colors">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>

          <ToastContainerWrapper />
          <ClientErrorCatcher />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
