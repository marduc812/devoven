import { LzStringConverter } from '@/Components/Functions/LzStringTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LZString Compress & Decompress Online | DevOven',
  description: 'Free online lz-string compressor and decompressor. Compress text to Base64, URL-safe, UTF-16 or hex, or decompress a payload from a URL or localStorage. Runs entirely in your browser.',
};

const page = () => <LzStringConverter />;
export default page;
