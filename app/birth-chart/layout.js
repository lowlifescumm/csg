export const metadata = {
  title: "Free Birth Chart Calculator: Natal Chart & Astrology Report | Cosmic Spirit Guide",
  description: "Generate your free birth chart instantly. Get your natal chart with Sun, Moon, Rising signs, planets & houses. Full astrological profile & personality analysis.",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/birth-chart",
  },
  openGraph: {
    type: "website",
    url: "https://cosmicspiritguide.com/birth-chart",
    title: "Free Birth Chart Calculator | Cosmic Spirit Guide",
    description: "Generate your free natal birth chart with Sun, Moon, Rising signs and full astrological profile.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Free Birth Chart Calculator - Cosmic Spirit Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Birth Chart Calculator | Cosmic Spirit Guide",
    description: "Generate your free natal chart with full astrological profile.",
    images: ["/logos/csg-logo-og.jpg"],
  },
};

export default function BirthChartLayout({ children }) {
  return children;
}
