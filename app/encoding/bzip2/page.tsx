import { Bzip2Decompressor } from '@/Components/Functions/CompressionTools2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bzip2 Decompress Online | DevOven',
  description: 'Free online bzip2 decompressor. Paste a bzip2 stream as Base64 or hex and read it back as text, including the tar inside a .tar.bz2. Runs entirely in your browser.',
};

const page = () => <Bzip2Decompressor />;
export default page;
