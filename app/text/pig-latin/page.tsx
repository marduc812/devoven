import { PigLatinConverter } from '@/Components/Functions/PigLatinTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/pig-latin', {
  title: 'Pig Latin Converter - DevOven',
  description: 'Convert text to and from Pig Latin. Words starting with vowels get yay appended; consonant clusters move to the end with ay. Instant Pig Latin conversion.',
});

const page = () => <PigLatinConverter />;
export default page;
