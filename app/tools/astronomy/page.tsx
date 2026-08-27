import type { Metadata } from 'next';
import { AstronomyCalculator } from '@/Components/Functions/AstronomyTools';

export const metadata: Metadata = {
  title: 'Astronomical Calculator | DevOven',
  description: 'Calculate sunrise, sunset, solar noon, day length, solar declination, equation of time, and moon phase for any date and location.',
};

export default function Page() {
  return <AstronomyCalculator />;
}
