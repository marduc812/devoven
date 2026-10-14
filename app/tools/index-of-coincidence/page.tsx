import { IndexOfCoincidenceCalculator } from '@/Components/Functions/IndexOfCoincidenceTools';
import { toolMetadata } from '@/lib/seo';

export const metadata = toolMetadata('/tools/index-of-coincidence', {
  title: 'Index of Coincidence Calculator',
  description: 'Calculate the raw and normalized Index of Coincidence for A-Z text, with letter counts. Runs in your browser.',
});

export default function Page() { return <IndexOfCoincidenceCalculator />; }
