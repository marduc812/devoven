import type { Metadata } from 'next';
import { MorseCodeConverter } from '@/Components/Functions/MorseCodeTools';

export const metadata: Metadata = {
  title: 'Morse Code Converter | DevOven',
  description: 'Free online Morse code encoder and decoder. Convert text to Morse code or decode Morse code back to text. Supports A-Z, 0-9, and common punctuation. Instant Morse Code conversion.',
};

export default function Page() {
  return <MorseCodeConverter />;
}
