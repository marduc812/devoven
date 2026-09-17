import { Rot13 } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/rot13', {
  title: 'Online ROT13 Encoder / Decoder',
  description: 'Free online ROT13 encoder and decoder. ROT13 is a self-inverse cipher — encode and decode with the same tool.',
});

const page = () => <Rot13 />;
export default page;
