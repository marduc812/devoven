import { NumberSequence } from '@/Components/Functions/NumberSequenceTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/tools/number-sequence', { title: 'Number Sequence Generator', description: 'Generate Fibonacci, primes, squares, triangular, arithmetic, geometric, and power sequences instantly.' });
const page = () => <NumberSequence />;
export default page;
