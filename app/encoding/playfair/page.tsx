import { PlayfairCipher } from '@/Components/Functions/PlayfairCipherTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playfair Cipher — Digraph Substitution Encoder',
  description: 'Free online Playfair cipher. Build a 5×5 key square from your keyword (I/J combined) and encrypt pairs of letters using same-row, same-column, or rectangle rules. Shows key square and digraph steps.',
};

const page = () => <PlayfairCipher />;
export default page;
