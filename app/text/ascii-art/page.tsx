import { AsciiArtConverter } from '@/Components/Functions/AsciiArtTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ASCII Art Generator — DevOven',
  description: 'Generate ASCII art from text using a block letter font. Supports A-Z, 0-9, and spaces.',
};

const page = () => <AsciiArtConverter />;
export default page;
