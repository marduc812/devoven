import { BrailleConverter } from '@/Components/Functions/BrailleTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text to Braille Converter | DevOven',
  description: 'Convert text to Grade 1 Braille Unicode patterns. Shows Braille characters and dot numbers for each cell. Supports A-Z, digits, and basic punctuation. Instant Text to Braille conversion.',
};

const page = () => <BrailleConverter />;
export default page;
