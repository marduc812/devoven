import { TapCode } from '@/Components/Functions/TapCodeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/tap-code', {
  title: 'Tap Code — POW Polybius Square Encoder',
  description: 'Free online tap code encoder and decoder. Uses the 5×5 Polybius square system used by prisoners of war. Each letter is row.col expressed as dot groups. K maps to C.',
});

const page = () => <TapCode />;
export default page;
