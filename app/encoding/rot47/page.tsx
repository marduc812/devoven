import { Rot47 } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/rot47', {
  title: 'Online ROT47 Encoder / Decoder',
  description: 'Free online ROT47 encoder and decoder. Rotates all printable ASCII characters by 47 — self-inverse.',
});

const page = () => <Rot47 />;
export default page;
