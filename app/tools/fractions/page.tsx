import type { Metadata } from 'next';
import { FractionCalculator } from '@/Components/Functions/FractionsTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/fractions', {
  title: 'Fraction Calculator | DevOven',
  description: 'Calculate fraction arithmetic with step-by-step working. Supports addition, subtraction, multiplication and division of fractions with reduced results.',
});

export default function Page() {
  return <FractionCalculator />;
}
