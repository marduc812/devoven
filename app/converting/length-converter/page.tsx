import { LengthConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Length Converter',
  description: 'Free online length and distance unit converter. Convert between metres, kilometres, centimetres, millimetres, miles, yards, feet, and inches instantly. Instant Length conversion.',
};

const page = () => <LengthConverter />;
export default page;
