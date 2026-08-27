import { Base58Encode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Base58 Encoder',
  description: 'Free online Base58 encoder using the Bitcoin alphabet. Encode text to Base58 instantly in your browser.',
};

const page = () => <Base58Encode />;
export default page;
