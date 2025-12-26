import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.moonReading);

export default function MoonReadingLayout({ children }) {
  return children;
}

