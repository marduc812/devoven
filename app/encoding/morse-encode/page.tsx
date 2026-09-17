import { MorseEncode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/morse-encode', {
  title: 'Text to Morse Code — Online Encoder | DevOven',
  description: 'Type text and get Morse code. One-way encoder for A-Z, 0-9 and punctuation, running in your browser. For audio playback and the full chart, use the Morse Code Converter.',
});

const page = () => <MorseEncode />;
export default page;
