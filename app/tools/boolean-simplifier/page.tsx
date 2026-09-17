import { BooleanSimplifier } from '@/Components/Functions/BooleanSimplifierTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/boolean-simplifier', {
  title: 'Boolean Expression Simplifier | DevOven',
  description: 'Generate truth tables for boolean expressions using variables A, B, C, D. Supports AND, OR, NOT, XOR, NAND, NOR, XNOR operators. Shows minterms and canonical Sum of Products form.',
});

const page = () => <BooleanSimplifier />;
export default page;
