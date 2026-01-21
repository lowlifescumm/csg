import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';
import HomePageClient from './_home-client';

export const metadata = generatePageMetadata(PAGE_METADATA.home);

export default function HomePage() {
    return <HomePageClient />;
}
