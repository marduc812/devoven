import { Base32Decode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Base32 Decoder',
  description: 'Free online Base32 decoder. Decode RFC 4648 Base32-encoded text back to plain text instantly.',
};

const page = () => <Base32Decode />;
export default page;
