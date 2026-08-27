import { MorseEncode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Morse Code Encoder',
  description: 'Free online Morse code encoder. Convert text to Morse code instantly in your browser.',
};

const page = () => <MorseEncode />;
export default page;
