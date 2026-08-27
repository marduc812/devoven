import { RailFenceCipher } from '@/Components/Functions/RailFenceCipherTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rail Fence Cipher — Encode & Decode Online',
  description: 'Free online Rail Fence cipher tool. Encode and decode text using the classic zigzag transposition cipher with configurable rails and ASCII art visualization.',
};

const page = () => <RailFenceCipher />;
export default page;
