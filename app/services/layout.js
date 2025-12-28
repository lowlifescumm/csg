import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.services);

export default function ServicesLayout({ children }) {
  return children;
}


