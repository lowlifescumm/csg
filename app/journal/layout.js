import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Spiritual Journal - Track Your Cosmic Journey",
  description: "Keep a personal spiritual journal to track your readings, insights, and cosmic journey. Reflect on your tarot readings and astrological insights.",
  path: "/journal",
  keywords: ["journal", "spiritual journal", "cosmic journal", "reading journal", "spiritual notes"],
});

export default function JournalLayout({ children }) {
  return children;
}


