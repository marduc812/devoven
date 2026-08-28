import { OrdinalTools } from '@/Components/Functions/OrdinalTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ordinal Number Converter - DevOven',
  description: 'Convert integers to ordinal numbers like 1st, 2nd, 3rd. Includes word forms (first, second, third) for numbers under 100. Instant Ordinal Number conversion.',
};

const page = () => <OrdinalTools />;
export default page;
