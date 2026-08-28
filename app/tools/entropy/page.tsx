import { EntropyCalculator } from '@/Components/Functions/EntropyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'String Entropy Calculator | DevOven',
  description: 'Calculate the Shannon entropy of any string. Analyze randomness, character frequency, and entropy bits per character.',
};

const page = () => <EntropyCalculator />;
export default page;
