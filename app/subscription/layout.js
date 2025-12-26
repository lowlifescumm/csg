import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.subscription);

export default function SubscriptionLayout({ children }) {
  return children;
}

