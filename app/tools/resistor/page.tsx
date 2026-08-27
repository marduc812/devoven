import { ResistorColorDecoder } from '@/Components/Functions/ResistorColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resistor Color Code | DevOven',
  description: 'Decode 4-band and 5-band resistor color codes to resistance values and tolerance, or find color bands for a given resistance. Includes E12, E24, E96 standard series lookup.',
};

const page = () => <ResistorColorDecoder />;
export default page;
