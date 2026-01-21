import { generatePageMetadata, PAGE_METADATA } from '@/lib/metadata';
import LoginPageClient from './_login-client';

export const metadata = generatePageMetadata(PAGE_METADATA.login);

export default function LoginPage() {
    return <LoginPageClient />;
}
