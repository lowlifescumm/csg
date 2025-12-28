import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.transits);

export default function TransitsLayout({ children }) {
  return children;
}


