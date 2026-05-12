export const metadata = {
  title: "Moon Phase Calculator & Today's Lunar Reading | Cosmic Spirit Guide",
  description: "Check today's moon phase with our free calculator. Get personalized lunar readings, moon sign meanings & spiritual guidance based on current moon energy.",
  metadataBase: new URL("https://cosmicspiritguide.com"),
  alternates: {
    canonical: "/moon-reading",
  },
  openGraph: {
    type: "website",
    url: "https://cosmicspiritguide.com/moon-reading",
    title: "Moon Phase Calculator & Lunar Reading | Cosmic Spirit Guide",
    description: "Check today's moon phase and get personalized lunar readings with spiritual guidance.",
    images: [
      {
        url: "/logos/csg-logo-og.jpg",
        width: 1200,
        height: 630,
        alt: "Moon Phase Calculator - Cosmic Spirit Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moon Phase Calculator & Lunar Reading | Cosmic Spirit Guide",
    description: "Check today's moon phase and get personalized lunar readings.",
    images: ["/logos/csg-logo-og.jpg"],
  },
};

export default function MoonReadingLayout({ children }) {
  return children;
}
