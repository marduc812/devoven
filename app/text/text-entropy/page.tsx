import type { Metadata } from 'next';
import { TextEntropyCalculator } from '@/Components/Functions/TextEntropyTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/text-entropy', {
  title: 'Text Entropy Calculator | DevOven',
  description: 'Calculate Shannon entropy for any text. See character frequency distribution, ASCII bar chart, and entropy interpretation compared to English and random text.',
});

export default function Page() {
  return <TextEntropyCalculator />;
}
