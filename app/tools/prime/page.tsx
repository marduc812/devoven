import { PrimeChecker } from '@/Components/Functions/PrimeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prime Number Checker | DevOven',
  description: 'Check if a number is prime, get its prime factorization, find the next prime, and see how many primes exist up to that number.',
};

const page = () => <PrimeChecker />;
export default page;
