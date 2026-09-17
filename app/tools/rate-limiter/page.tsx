import { RateLimiterCalculator } from '@/Components/Functions/RateLimiterTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/rate-limiter', {
  title: 'Rate Limiter Calculator | DevOven',
  description: 'Calculate rate limiting parameters for token bucket, leaky bucket, fixed window, and sliding window algorithms. Get burst capacity, recovery time, and HTTP headers.',
});

const page = () => <RateLimiterCalculator />;
export default page;
