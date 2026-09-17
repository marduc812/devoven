import type { Metadata } from 'next';
import { AstronomyCalculator } from '@/Components/Functions/AstronomyTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/astronomy', {
  title: 'Astronomical Calculator | DevOven',
  description: 'Calculate sunrise, sunset, solar noon, day length, solar declination, equation of time, and moon phase for any date and location.',
});

export default function Page() {
  return <AstronomyCalculator />;
}
