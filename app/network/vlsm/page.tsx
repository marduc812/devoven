import { VlsmCalculator } from '@/Components/Functions/VlsmTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VLSM Calculator — DevOven',
  description:
    'Variable Length Subnet Masking (VLSM) calculator. Divide a network into subnets of different sizes based on host requirements. Enter a base CIDR and required hosts per subnet — allocation is done largest-first for efficient address usage.',
};

const page = () => <VlsmCalculator />;
export default page;
