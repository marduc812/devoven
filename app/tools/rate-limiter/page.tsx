import { RateLimiterCalculator } from '@/Components/Functions/RateLimiterTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rate Limiter Calculator | DevOven',
  description: 'Calculate rate limiting parameters for token bucket, leaky bucket, fixed window, and sliding window algorithms. Get burst capacity, recovery time, and HTTP headers.',
};

const page = () => <RateLimiterCalculator />;
export default page;
