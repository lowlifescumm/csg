import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.terms);

export default function TermsLayout({ children }) {
  return children;
}


