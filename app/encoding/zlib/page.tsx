import { ZlibConverter } from '@/Components/Functions/CompressionTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zlib Deflate & Inflate Online | DevOven',
  description: 'Free online zlib compressor and decompressor. Deflate text into a zlib stream (RFC 1950) as Base64 or hex, or inflate one back. Runs entirely in your browser.',
};

const page = () => <ZlibConverter />;
export default page;
