import type { Metadata } from 'next';
import { MorseCodeConverter } from '@/Components/Functions/MorseCodeTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/morse-code', {
  title: 'Morse Code Converter — Translate, Play and Learn | DevOven',
  description: 'Convert text to Morse code and back, play it as a keyed tone at any speed, and read the full character chart. Supports A-Z, 0-9, punctuation and prosigns. Runs in your browser.',
});

export default function Page() {
  return <MorseCodeConverter />;
}
