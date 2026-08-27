import { BaconCipher } from '@/Components/Functions/BaconCipherTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Bacon's Cipher — Biliteral Cipher Encoder",
  description: "Free online Bacon's biliteral cipher. Encode text to 5-bit A/B codes or decode A/B sequences back to text. Supports A/B and 0/1 representations.",
};

const page = () => <BaconCipher />;
export default page;
