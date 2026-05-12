export const metadata = {
  title: "Free Daily Tarot Reading & Horoscope | Cosmic Spirit Guide",
  description: "Get your free daily tarot card reading & personalized horoscope today. 3 free readings daily. AI-powered astrology insights for love, career & spiritual guidance.",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    type: "website",
    url: "https://cosmicspiritguide.com/dashboard",
    title: "Free Daily Tarot & Horoscope | Cosmic Spirit Guide",
    description: "Get your free daily tarot reading and personalized horoscope. 3 free readings daily with AI-powered insights.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Free Daily Tarot & Horoscope - Cosmic Spirit Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Daily Tarot & Horoscope | Cosmic Spirit Guide",
    description: "Get your free daily tarot reading and personalized horoscope.",
    images: ["/logos/csg-logo-og.jpg"],
  },
};

export default function DashboardLayout({ children }) {
  return children;
}
