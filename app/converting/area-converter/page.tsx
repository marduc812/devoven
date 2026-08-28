import { AreaConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Area Converter',
  description: 'Free online area unit converter. Convert between square metres, square kilometres, square feet, square miles, acres, and hectares instantly. Instant Area conversion.',
};

const page = () => <AreaConverter />;
export default page;
