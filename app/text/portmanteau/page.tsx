import { PortmanteauGenerator } from '@/Components/Functions/PortmanteauTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portmanteau Generator — Blend Two Words | DevOven',
  description: 'Generate portmanteau word blends from two words. Uses overlap detection, syllable splitting, and midpoint cuts. Examples: smoke+fog=smog, motor+hotel=motel.',
};

const page = () => {
  return (
    <>
      <PortmanteauGenerator />
    </>
  );
};

export default page;
