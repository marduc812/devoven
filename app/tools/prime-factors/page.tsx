import type { Metadata } from 'next';
import { PrimeFactors } from '@/Components/Functions/PrimeFactorsTools';

export const metadata: Metadata = {
  title: 'Prime Factorization | DevOven',
  description: 'Find the prime factorization of any integer. Shows all divisors, divisor count, sum of divisors, and classifies the number as perfect, abundant, or deficient.',
};

export default function Page() {
  return <PrimeFactors />;
}
