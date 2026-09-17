import { NumberToWords } from '@/Components/Functions/NumberToWordsTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-to-words', {
  title: 'Online Number to Words Converter',
  description: 'Free online number to English words converter. Converts integers and decimals up to trillions, including negatives. Instant Number to Words conversion.',
});

const page = () => <NumberToWords />;
export default page;
