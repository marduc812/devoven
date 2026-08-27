import { Ascii85Decode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Ascii85 Decoder',
  description: 'Free online Ascii85 (Base85) decoder. Decode Ascii85-encoded text back to plain text instantly.',
};

const page = () => <Ascii85Decode />;
export default page;
