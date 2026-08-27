import { CaesarCipherConverter } from '@/Components/Functions/CaesarCipherTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Caesar Cipher Encoder',
  description: 'Free online Caesar cipher encoder. Shift letters by any amount to encode or decode messages.',
};

const page = () => <CaesarCipherConverter />;
export default page;
