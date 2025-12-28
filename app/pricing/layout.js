import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.pricing);

export default function PricingLayout({ children }) {
  return children;
}


