import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';
import MasterReportClient from './_master-client';

export const metadata = generatePageMetadata(PAGE_METADATA.masterReport);

export default function MasterReportPage() {
  return <MasterReportClient />;
}
