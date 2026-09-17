import type { Metadata } from 'next';
import { ReverseText } from '@/Components/Functions/TextUtilities';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/reverse-text', {
  title: 'Reverse Text / Lines | DevOven',
  description: 'Reverse an entire string character-by-character, or reverse the order of lines. Browser-side, no server.',
});

const page = () => <ReverseText />;
export default page;
