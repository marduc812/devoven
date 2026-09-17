import type { Metadata } from 'next';
import { TextSoundexConverter } from '@/Components/Functions/TextSoundexTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/soundex', {
  title: 'Soundex & Phonetic Codes | DevOven',
  description: 'Generate Soundex, Metaphone, and Double Metaphone phonetic codes for English words and names.',
});

export default function Page() {
  return <TextSoundexConverter />;
}
