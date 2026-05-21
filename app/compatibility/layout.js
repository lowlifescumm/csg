export const metadata = {
  title: "Free Love Compatibility Test & Zodiac Match Calculator | Cosmic Spirit Guide",
  description: "Calculate your love compatibility by zodiac sign. Free relationship match test comparing birth charts for romance, friendship & soulmate connections. Get instant astrology insights.",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/compatibility",
  },
  openGraph: {
    type: "website",
    url: "https://cosmicspiritguide.com/compatibility",
    title: "Free Love Compatibility Test | Cosmic Spirit Guide",
    description: "Calculate your zodiac love compatibility. Free relationship match test with instant astrology insights.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Free Love Compatibility Test - Cosmic Spirit Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Love Compatibility Test | Cosmic Spirit Guide",
    description: "Calculate your zodiac love compatibility with free relationship match test.",
    images: ["/logos/csg-logo-og.jpg"],
  },
};

export default function CompatibilityLayout({ children }) {
  return children;
}
