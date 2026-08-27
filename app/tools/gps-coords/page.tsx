import type { Metadata } from 'next';
import { GpsCoordsConverter } from '@/Components/Functions/GpsCoordsTools';

export const metadata: Metadata = {
  title: 'GPS Coordinate Converter | DevOven',
  description: 'Convert GPS coordinates between Decimal Degrees, Degrees Minutes Seconds, Degrees Decimal Minutes, and UTM formats. Instant GPS Coordinate conversion.',
};

export default function Page() {
  return <GpsCoordsConverter />;
}
