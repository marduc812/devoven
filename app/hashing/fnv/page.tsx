import { FnvHashCalculator } from '@/Components/Functions/FnvHashTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FNV Hash Calculator | DevOven',
  description: 'Free online FNV-1 and FNV-1a hash calculator (32-bit and 64-bit). Fowler-Noll-Vo is a fast non-cryptographic hash used in hash tables and networking. Runs entirely in your browser.',
};

const page = () => <FnvHashCalculator />;
export default page;
