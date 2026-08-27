import { SiPrefixConverter } from '@/Components/Functions/SiPrefixTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SI Prefix Converter | DevOven',
  description: 'Convert between SI prefixes (yotta to yocto) for any unit. Instantly convert MHz to GHz, km to mm, and more. Includes a full SI prefix reference table. Instant SI Prefix conversion.',
};

const page = () => <SiPrefixConverter />;
export default page;
