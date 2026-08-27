import { Base32Encode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Base32 Encoder',
  description: 'Free online Base32 encoder. Encode text to RFC 4648 Base32 instantly in your browser.',
};

const page = () => <Base32Encode />;
export default page;
