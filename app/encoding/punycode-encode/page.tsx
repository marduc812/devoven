import { PunycodeEncode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/punycode-encode', {
  title: 'Online Punycode Encoder',
  description: 'Free online Punycode encoder. Convert Unicode internationalized domain names to ASCII-compatible Punycode.',
});

const page = () => <PunycodeEncode />;
export default page;
