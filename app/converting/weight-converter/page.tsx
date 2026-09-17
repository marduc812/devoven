import { WeightConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/weight-converter', {
  title: 'Online Weight Converter',
  description: 'Free online weight and mass unit converter. Convert between kilograms, grams, pounds, ounces, and metric tonnes instantly. Instant Weight conversion.',
});

const page = () => <WeightConverter />;
export default page;
