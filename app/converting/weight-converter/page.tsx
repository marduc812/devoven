import { WeightConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Weight Converter',
  description: 'Free online weight and mass unit converter. Convert between kilograms, grams, pounds, ounces, and metric tonnes instantly. Instant Weight conversion.',
};

const page = () => <WeightConverter />;
export default page;
