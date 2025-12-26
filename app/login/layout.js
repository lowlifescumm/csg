import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.login);

export default function LoginLayout({ children }) {
  return children;
}

