import { CharFrequencyTools } from '@/Components/Functions/CharFrequencyTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/char-frequency', {
  title: 'Character Frequency Counter - DevOven',
  description: 'Count character frequencies in any text. See a sorted table of characters with occurrence counts and percentages.',
});

const page = () => <CharFrequencyTools />;
export default page;
