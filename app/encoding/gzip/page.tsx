import { GzipConverter } from '@/Components/Functions/CompressionTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gzip Compress & Decompress Online | DevOven',
  description: 'Free online gzip compressor and decompressor. Gzip text to Base64 or hex, or gunzip it back, with a selectable compression level. Runs entirely in your browser.',
};

const page = () => <GzipConverter />;
export default page;
