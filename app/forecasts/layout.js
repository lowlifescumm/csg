import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Daily Forecasts - Personalized Astrological Forecasts",
  description: "Get personalized daily, weekly, and monthly astrological forecasts based on your birth chart. Track upcoming transits and cosmic influences.",
  path: "/forecasts",
  keywords: ["forecasts", "astrological forecast", "daily forecast", "transit forecast", "cosmic forecast"],
});

export default function ForecastsLayout({ children }) {
  return children;
}

