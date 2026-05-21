import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';
import AdvancedReportClient from './_advanced-client';

export const metadata = generatePageMetadata(PAGE_METADATA.advancedReport);

export default function AdvancedReportPage() {
  return <AdvancedReportClient />;
}
