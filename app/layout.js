import "./globals.css";
import { Inter, Cormorant_Garamond } from "next/font/google";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import Header from "@/components/Header";
import ToastContainerWrapper from "@/components/ui/ToastContainerWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientErrorCatcher from "@/components/ClientErrorCatcher";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Next.js 15 requires viewport to be exported separately from metadata
export const viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Free Tarot Reading & Birth Chart Calculator | Cosmic Spirit Guide",
  description:
    "Get your free daily tarot reading and personalized birth chart. AI-powered astrology insights, compatibility tests, and spiritual guidance.",
  keywords: [
    "free tarot reading",
    "birth chart calculator",
    "astrology compatibility",
    "daily horoscope",
    "spiritual guidance",
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
    <html lang="en" className={`${inter.variable} ${cormorant.variable} scroll-smooth`}>
      <head>
        {/* Preload primary logo for LCP optimization */}
        <link
          rel="preload"
          href="/logos/csg-logo-primary.svg"
          as="image"
          type="image/svg+xml"
        />

        {/* Preconnect to Google Fonts for Cormorant Garamond */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
      </head>

      <body
        className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 antialiased"
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

          <footer className="glassmorphic border-t border-white border-opacity-20 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  Powered by AI • Tarot • Horoscopes • Birth Charts
                </p>
                <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
                  <a href="/privacy" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">
                    Terms of Service
                  </a>
                  <a href="/contact" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">
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
