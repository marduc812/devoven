import { LzmaConverter } from '@/Components/Functions/CompressionTools2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LZMA Compress & Decompress Online | DevOven',
  description: 'Free online LZMA compressor and decompressor. Compress text into the .lzma alone format as Base64 or hex, or decompress it back, with a selectable preset. Runs entirely in your browser.',
};

const page = () => <LzmaConverter />;
export default page;
