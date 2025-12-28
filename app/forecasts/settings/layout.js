import { generatePageMetadata } from '@/lib/metadata';

export const metadata = generatePageMetadata({
  title: "Forecast Settings - Customize Your Forecasts",
  description: "Customize your forecast preferences. Set notification preferences, transit sensitivity, and forecast delivery options.",
  path: "/forecasts/settings",
  keywords: ["forecast settings", "forecast preferences", "notification settings", "transit settings"],
});

export default function ForecastSettingsLayout({ children }) {
  return children;
}


