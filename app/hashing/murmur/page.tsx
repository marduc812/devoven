import { MurmurHashCalculator } from '@/Components/Functions/MurmurHashTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MurmurHash3 Calculator | DevOven',
  description: 'Free online MurmurHash3 (32-bit) calculator. Fast non-cryptographic hash function for hash tables and bloom filters. Supports custom seed values. Runs entirely in your browser.',
};

const page = () => <MurmurHashCalculator />;
export default page;
