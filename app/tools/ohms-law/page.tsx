import { OhmsLaw } from '@/Components/Functions/OhmsLawTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Ohm's Law Calculator | DevOven",
  description: "Compute voltage, current, resistance, and power from any two known values using Ohm's Law (V=IR) and power formulas. Includes resistor color code display.",
};

const page = () => <OhmsLaw />;
export default page;
