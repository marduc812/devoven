import { AtbashCipher } from '@/Components/Functions/AtbashCipherTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atbash Cipher — Reverse Alphabet Encoder',
  description: 'Free online Atbash cipher. Encode or decode text using reverse alphabet substitution (A↔Z, B↔Y). Since Atbash is its own inverse, encode and decode are the same. Also supports Hebrew Atbash.',
};

const page = () => <AtbashCipher />;
export default page;
