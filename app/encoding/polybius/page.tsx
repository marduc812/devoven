import { PolybiusCipher } from '@/Components/Functions/PolybiusCipherTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/polybius', {
  title: 'Polybius Square Cipher — Encode & Decode Online',
  description: 'Free online Polybius Square cipher. Encode text to row/column number pairs using a 5×5 grid. Supports custom keyword to rearrange the alphabet.',
});

const page = () => <PolybiusCipher />;
export default page;
