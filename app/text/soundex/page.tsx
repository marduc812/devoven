import type { Metadata } from 'next';
import { TextSoundexConverter } from '@/Components/Functions/TextSoundexTools';

export const metadata: Metadata = {
  title: 'Soundex & Phonetic Codes | DevOven',
  description: 'Generate Soundex, Metaphone, and Double Metaphone phonetic codes for English words and names.',
};

export default function Page() {
  return <TextSoundexConverter />;
}
