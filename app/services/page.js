import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';
import ServicesPageClient from './_services-client';

export const metadata = generatePageMetadata(PAGE_METADATA.services);

export default function ServicesPage() {
    return <ServicesPageClient />;
}
