import type { Metadata } from 'next';
import { UnitPriceComparator } from '@/Components/Functions/UnitPriceTools';

export const metadata: Metadata = {
  title: 'Unit Price Comparator | DevOven',
  description: 'Compare prices per unit across 2–5 products. Supports weight (kg, g, oz, lb), volume (L, mL, fl oz), and count/pack units. Find the best value instantly.',
};

export default function Page() {
  return <UnitPriceComparator />;
}
