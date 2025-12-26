import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.credits);

export default function CreditsLayout({ children }) {
  return children;
}

