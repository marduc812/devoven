import { Base58Decode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base58-decode', {
  title: 'Online Base58 Decoder',
  description: 'Free online Base58 decoder. Decode Bitcoin-alphabet Base58 text back to plain text instantly.',
});

const page = () => <Base58Decode />;
export default page;
