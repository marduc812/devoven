import { CacheTtlCalculator } from '@/Components/Functions/CacheTtlTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cache TTL Calculator | DevOven',
  description: 'Calculate cache TTL in all units, generate Cache-Control and Expires headers, and get CDN equivalents for Cloudflare, Fastly, and Varnish. Also parse Cache-Control header directives.',
};

const page = () => <CacheTtlCalculator />;
export default page;
