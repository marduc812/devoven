import { OhmsLaw } from '@/Components/Functions/OhmsLawTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/ohms-law', {
  title: "Ohm's Law Calculator | DevOven",
  description: "Compute voltage, current, resistance, and power from any two known values using Ohm's Law (V=IR) and power formulas. Includes resistor color code display.",
});

const page = () => <OhmsLaw />;
export default page;
