import { BooleanSimplifier } from '@/Components/Functions/BooleanSimplifierTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boolean Expression Simplifier | DevOven',
  description: 'Generate truth tables for boolean expressions using variables A, B, C, D. Supports AND, OR, NOT, XOR, NAND, NOR, XNOR operators. Shows minterms and canonical Sum of Products form.',
};

const page = () => <BooleanSimplifier />;
export default page;
