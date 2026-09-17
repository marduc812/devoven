import { MorseDecode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/morse-decode', {
  title: 'Morse Code to Text — Online Decoder | DevOven',
  description: 'Paste dots and dashes and read the message back. One-way Morse decoder running in your browser. For audio playback and the full chart, use the Morse Code Converter.',
});

const page = () => <MorseDecode />;
export default page;
