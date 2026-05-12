export const metadata = {
  title: "Free Daily Astrology Forecast & Horoscope | Cosmic Spirit Guide",
  description: "Get your free daily astrology forecast & horoscope. Personalized zodiac predictions, planetary transits & what the stars say about your day ahead.",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/forecasts",
  },
  openGraph: {
    type: "website",
    url: "https://cosmicspiritguide.com/forecasts",
    title: "Free Daily Astrology Forecast & Horoscope | Cosmic Spirit Guide",
    description: "Get your free daily astrology forecast with personalized zodiac predictions and planetary transits.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Free Daily Astrology Forecast - Cosmic Spirit Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Daily Astrology Forecast & Horoscope | Cosmic Spirit Guide",
    description: "Get your free daily astrology forecast with personalized zodiac predictions.",
    images: ["/logos/csg-logo-og.jpg"],
  },
};

export default function ForecastsLayout({ children }) {
  return children;
}
