import { ModularArith } from '@/Components/Functions/ModularArithTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modular Arithmetic Calculator - Mod, Modular Exponentiation',
  description: 'Evaluate modular expressions like 17 mod 5, 2^10 mod 1000, or (3 * 7) mod 11. Supports addition, subtraction, multiplication and fast modular exponentiation with step-by-step output.',
};

const page = () => <ModularArith />;
export default page;
