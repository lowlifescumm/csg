import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Energy Log - Track Your Daily Energy",
  description: "Track your daily energy levels and see how they correlate with astrological transits and moon phases.",
  path: "/energy/log",
  keywords: ["energy log", "energy tracking", "daily energy", "energy levels", "spiritual energy"],
});

export default function EnergyLogLayout({ children }) {
  return children;
}

