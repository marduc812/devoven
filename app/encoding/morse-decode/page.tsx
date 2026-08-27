import { MorseDecode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Morse Code Decoder',
  description: 'Free online Morse code decoder. Convert Morse code back to plain text instantly.',
};

const page = () => <MorseDecode />;
export default page;
