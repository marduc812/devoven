import type { Metadata } from 'next';
import { CspBuilder } from '@/Components/Functions/CspBuilderTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/csp-builder', {
  title: 'Content Security Policy Builder | DevOven',
  description: 'Build a Content-Security-Policy header for your website. Configure script, style, font, image, and connect sources. Supports nonce-based CSP, strict-dynamic, and includes security warnings for unsafe-inline and unsafe-eval.',
});

export default function Page() {
  return <CspBuilder />;
}
