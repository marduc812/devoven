import { Rot47 } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/rot47', {
  title: 'Online ROT47 Encoder / Decoder',
  description: 'Encode and decode ROT47 text, or try all 94 ASCII rotation shifts with brute force. Runs in your browser.',
});

const page = () => <Rot47 />;
export default page;
