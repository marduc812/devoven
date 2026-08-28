import { Base58Decode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Base58 Decoder',
  description: 'Free online Base58 decoder. Decode Bitcoin-alphabet Base58 text back to plain text instantly.',
};

const page = () => <Base58Decode />;
export default page;
