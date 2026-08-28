import { NumberTheoryCalc } from '@/Components/Functions/NumberTheoryTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Number Theory Calculator - DevOven',
  description: 'Comprehensive number theory analysis: primality, prime factorization, Euler totient, divisors, sigma function, Möbius function, Liouville function, Carmichael numbers, Collatz sequence, and more.',
};

const page = () => <NumberTheoryCalc />;
export default page;
