import { ScientificNotationConverter } from '@/Components/Functions/ScientificNotationTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scientific Notation Converter | DevOven',
  description: 'Convert decimal numbers to scientific, engineering, and exponential notation. Parse scientific notation like 1.5e+3 back to plain numbers. Instant Scientific Notation conversion.',
};

const page = () => <ScientificNotationConverter />;
export default page;
