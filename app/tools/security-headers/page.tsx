import type { Metadata } from 'next';
import { SecurityHeadersGenerator } from '@/Components/Functions/SecurityHeadersTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/security-headers', {
  title: 'Security Headers Generator | DevOven',
  description: 'Generate a complete set of HTTP security headers: Content-Security-Policy, HSTS, X-Frame-Options, Permissions-Policy, COEP, COOP, and more. Configure for SPAs, external fonts, embeds, and analytics.',
});

export default function Page() {
  return <SecurityHeadersGenerator />;
}
