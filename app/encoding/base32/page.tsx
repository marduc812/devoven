import { Base32Converter } from '@/Components/Functions/Base32Tools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base32 Encoder / Decoder | DevOven',
  description: 'Free online Base32 encoder and decoder (RFC 4648). Auto-detects whether to encode or decode. Runs entirely in your browser.',
};

const page = () => <Base32Converter />;
export default page;
