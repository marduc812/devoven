import { BeaufortCipher } from '@/Components/Functions/BeaufortCipherTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/beaufort', {
  title: 'Beaufort Cipher — Symmetric Vigenère Variant',
  description: 'Free online Beaufort cipher encoder and decoder. A symmetric variant of the Vigenère cipher: E(i) = (key[i] − plain[i] + 26) mod 26. Encrypting twice returns the original text.',
});

const page = () => <BeaufortCipher />;
export default page;
