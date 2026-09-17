import { Base85Converter } from '@/Components/Functions/Base85Tools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base85', {
  title: 'Base85 / Ascii85 Encoder & Decoder | DevOven',
  description: 'Free online Base85 (Ascii85) encoder and decoder. Groups 4 bytes into 5 ASCII characters. Supports Adobe <~...~> delimiters and raw Base85. Runs entirely in your browser.',
});

const page = () => <Base85Converter />;
export default page;
