import type { Metadata } from 'next';
import { RateLimitCalculator } from '@/Components/Functions/RateLimitCalcTools';

export const metadata: Metadata = {
  title: 'API Rate Limit Calculator | DevOven',
  description: 'Calculate API rate limits: convert requests per period, apply safety margins (80%, 90%), compute token bucket parameters and retry-after timing.',
};

export default function Page() {
  return <RateLimitCalculator />;
}
