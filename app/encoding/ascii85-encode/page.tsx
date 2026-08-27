import { Ascii85Encode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Ascii85 Encoder',
  description: 'Free online Ascii85 (Base85) encoder. Encode text or binary data to Ascii85 format instantly.',
};

const page = () => <Ascii85Encode />;
export default page;
