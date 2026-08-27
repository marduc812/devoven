import { ColorTemperature } from '@/Components/Functions/ColorTemperatureTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Temperature Converter | DevOven',
  description: 'Convert Kelvin color temperature to Mired, RGB, and Hex values. Useful for lighting design, photography, and display calibration. Instant Color Temperature conversion.',
};

const page = () => <ColorTemperature />;
export default page;
