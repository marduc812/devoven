import type { Metadata } from 'next';
import { SecurityHeadersGenerator } from '@/Components/Functions/SecurityHeadersTools';

export const metadata: Metadata = {
  title: 'Security Headers Generator | DevOven',
  description: 'Generate a complete set of HTTP security headers: Content-Security-Policy, HSTS, X-Frame-Options, Permissions-Policy, COEP, COOP, and more. Configure for SPAs, external fonts, embeds, and analytics.',
};

export default function Page() {
  return <SecurityHeadersGenerator />;
}
