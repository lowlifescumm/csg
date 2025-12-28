import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.about);

export default function AboutLayout({ children }) {
  return children;
}


