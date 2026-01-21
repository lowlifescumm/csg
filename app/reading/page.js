import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';
import ReadingLandingPageClient from './_reading-client';

export const metadata = generatePageMetadata(PAGE_METADATA.reading);

export default function ReadingLandingPage() {
    return <ReadingLandingPageClient />;
}
