import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Tour & Demo - Explore Cosmic Spiritual Guide",
  description: "Take a tour of Cosmic Spiritual Guide features. See how tarot readings, birth charts, and spiritual guidance work.",
  path: "/tour-demo",
  keywords: ["tour", "demo", "features", "how it works", "spiritual guide tour"],
});

export default function TourDemoLayout({ children }) {
  return children;
}


