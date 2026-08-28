import { MultiHashCalculator } from '@/Components/Functions/MultiHashTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Hash Calculator - DevOven',
  description: 'Compute MD5, SHA-1, SHA-256, SHA-384, SHA-512, CRC32, Adler-32, and xxHash32 for any text at once. Paste an expected hash to highlight which algorithm matches.',
};

const page = () => <MultiHashCalculator />;
export default page;
