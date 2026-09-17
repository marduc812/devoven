import { AffineCipher } from '@/Components/Functions/AffineCipherTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/affine-cipher', {
  title: 'Affine Cipher — Encrypt & Decrypt Online',
  description: 'Free online Affine cipher tool. Encrypt and decrypt text using E(x) = (ax + b) mod 26 with step-by-step breakdown.',
});

const page = () => <AffineCipher />;
export default page;
