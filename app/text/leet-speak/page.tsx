import { LeetSpeakTools } from '@/Components/Functions/LeetSpeakTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/leet-speak', {
  title: 'Leet Speak Converter - DevOven',
  description: 'Convert text to leet speak (1337) or decode leet back to normal text. Includes an advanced mode with extended character substitutions. Instant Leet Speak conversion.',
});

const page = () => <LeetSpeakTools />;
export default page;
