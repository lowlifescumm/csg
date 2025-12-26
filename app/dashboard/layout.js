import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.dashboard);

export default function DashboardLayout({ children }) {
  return children;
}

