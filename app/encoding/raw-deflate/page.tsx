import { RawDeflateConverter } from '@/Components/Functions/CompressionTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/raw-deflate', {
  title: 'Raw Deflate & Inflate Online | DevOven',
  description: 'Free online raw DEFLATE compressor and decompressor. Compress text into a headerless DEFLATE stream (RFC 1951) as Base64 or hex, or inflate one back. Runs entirely in your browser.',
});

const page = () => <RawDeflateConverter />;
export default page;
