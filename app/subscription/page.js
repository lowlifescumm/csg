import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// The dual pricing page (/subscription) has been unified into /pricing.
// Keep the route as a 307 redirect so existing links, Stripe success/cancel
// URLs, and bookmarks land on the single source of truth. Query params are
// preserved so /subscription?success=true&tier=MYSTIC_LITE → /pricing?success=true&tier=MYSTIC_LITE
export default async function SubscriptionPage({ searchParams }) {
  const params = new URLSearchParams();
  if (searchParams && typeof searchParams === 'object') {
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === 'string') params.set(k, v);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/pricing?${qs}` : '/pricing');
}