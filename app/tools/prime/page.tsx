import { PrimeChecker } from '@/Components/Functions/PrimeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/prime', {
  title: 'Prime Number Checker — Is It Prime? Any Size | DevOven',
  description: 'Check whether a number is prime, with its prime factorization, every divisor, the neighbouring primes and the count of primes below it. Numbers past a trillion are tested with Miller-Rabin.',
});

const page = () => <PrimeChecker />;
export default page;
