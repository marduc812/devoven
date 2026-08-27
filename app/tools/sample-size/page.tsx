import type { Metadata } from 'next';
import { SampleSizeCalculator } from '@/Components/Functions/SampleSizeTools';

export const metadata: Metadata = {
  title: 'Sample Size Calculator | DevOven',
  description: 'Calculate the required sample size for a survey or experiment. Enter population, confidence level (90/95/99%), and margin of error. Uses the Cochran formula with finite population correction.',
};

export default function Page() {
  return <SampleSizeCalculator />;
}
