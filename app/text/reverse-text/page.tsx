import type { Metadata } from 'next';
import { ReverseText } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Reverse Text / Lines | DevOven',
  description: 'Reverse an entire string character-by-character, or reverse the order of lines. Browser-side, no server.',
};

const page = () => <ReverseText />;
export default page;
