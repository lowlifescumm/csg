import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.compatibility);

export default function CompatibilityLayout({ children }) {
  return children;
}


