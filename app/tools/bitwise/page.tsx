import { BitwiseCalculator } from '@/Components/Functions/BitwiseCalcTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/bitwise', {
  title: 'Bitwise Operations Calculator | DevOven',
  description: 'Calculate bitwise AND, OR, XOR, NAND, NOR, NOT, left shift, right shift, and unsigned right shift for two integers. Shows 32-bit binary representation with two\'s complement support.',
});

const page = () => <BitwiseCalculator />;
export default page;
