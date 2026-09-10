import type { Metadata } from 'next';
import { RateLimitCalculator } from '@/Components/Functions/RateLimitCalcTools';

export const metadata: Metadata = {
  title: 'API Rate Limit Calculator | DevOven',
  description: 'Convert an API rate limit between periods, find the gap you need between requests, size a token bucket, split the quota across clients, and plan a retry schedule for 429s.',
};

export default function Page() {
  return <RateLimitCalculator />;
}
