import { XorCipher } from '@/Components/Functions/XorCipherTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/xor-cipher', {
  title: 'XOR Cipher — Repeating Key XOR Encryption',
  description: 'Free online XOR cipher tool. Encrypt text with a repeating key XOR and output hex, or decrypt hex ciphertext back to plaintext.',
});

const page = () => <XorCipher />;
export default page;
