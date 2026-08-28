import { NumberSequence } from '@/Components/Functions/NumberSequenceTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Number Sequence Generator', description: 'Generate Fibonacci, primes, squares, triangular, arithmetic, geometric, and power sequences instantly.' };
const page = () => <NumberSequence />;
export default page;
