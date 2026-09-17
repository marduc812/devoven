import { NumberTheoryCalc } from '@/Components/Functions/NumberTheoryTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/number-theory', {
  title: 'Number Theory Calculator - DevOven',
  description: 'Comprehensive number theory analysis: primality, prime factorization, Euler totient, divisors, sigma function, Möbius function, Liouville function, Carmichael numbers, Collatz sequence, and more.',
});

const page = () => <NumberTheoryCalc />;
export default page;
