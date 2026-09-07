import { AllHashes } from '@/Components/Functions/AllHashesTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generate All Hashes Online | DevOven',
  description: 'Hash one input with every algorithm at once — MD5, SHA-1, SHA-2, SHA-3, Keccak, BLAKE2, BLAKE3, RIPEMD160, Whirlpool, SM3, CRC32, Adler-32, FNV and MurmurHash. Runs entirely in your browser.',
};

const page = () => <AllHashes />;
export default page;
