import { CacheTtlCalculator } from '@/Components/Functions/CacheTtlTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/cache-ttl', {
  title: 'Cache TTL Calculator | DevOven',
  description: 'Calculate cache TTL in all units, generate Cache-Control and Expires headers, and get CDN equivalents for Cloudflare, Fastly, and Varnish. Also parse Cache-Control header directives.',
});

const page = () => <CacheTtlCalculator />;
export default page;
