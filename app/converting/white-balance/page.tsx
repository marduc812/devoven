import { WhiteBalanceConverter } from '@/Components/Functions/WhiteBalanceTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'White Balance Converter | DevOven',
  description: 'Convert Kelvin color temperature to photography white balance presets, RGB color approximation, and CSS filter values. Covers 1000K to 12000K. Instant White Balance conversion.',
};

const page = () => <WhiteBalanceConverter />;
export default page;
