import type { Metadata } from 'next';
import { GpsCoordsConverter } from '@/Components/Functions/GpsCoordsTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/gps-coords', {
  title: 'GPS Coordinate Converter | DevOven',
  description: 'Convert GPS coordinates between Decimal Degrees, Degrees Minutes Seconds, Degrees Decimal Minutes, and UTM formats. Instant GPS Coordinate conversion.',
});

export default function Page() {
  return <GpsCoordsConverter />;
}
