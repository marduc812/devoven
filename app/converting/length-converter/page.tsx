import { LengthConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/length-converter', {
  title: 'Online Length Converter',
  description: 'Free online length and distance unit converter. Convert between metres, kilometres, centimetres, millimetres, miles, yards, feet, and inches instantly. Instant Length conversion.',
});

const page = () => <LengthConverter />;
export default page;
