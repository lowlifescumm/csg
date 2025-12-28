import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';

export const metadata = generatePageMetadata(PAGE_METADATA.birthChart);

export default function BirthChartLayout({ children }) {
  return children;
}


