import { FibonacciGenerator } from '@/Components/Functions/FibonacciTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fibonacci Generator | DevOven',
  description: 'Generate Fibonacci numbers up to 1000 terms with exact precision using BigInt. Shows each term with its index and the digit count of the last term.',
};

const page = () => <FibonacciGenerator />;
export default page;
