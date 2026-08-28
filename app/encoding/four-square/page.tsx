import { FourSquareCipher } from '@/Components/Functions/FourSquareCipherTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Four-Square Cipher — Digraphic Polybius Substitution',
  description: 'Free online four-square cipher. Encrypts digraphs using four 5×5 Polybius squares: two standard alphabet squares and two keyword squares. Shows all four squares in the output.',
};

const page = () => <FourSquareCipher />;
export default page;
