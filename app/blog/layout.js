import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.blog);

export default function BlogLayout({ children }) {
  return children;
}

