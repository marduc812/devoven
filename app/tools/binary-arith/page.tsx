import { BinaryArithCalculator } from '@/Components/Functions/BinaryArithTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/binary-arith', {
  title: 'Binary Arithmetic Calculator - DevOven',
  description: 'Perform addition, subtraction, multiplication, and division on binary numbers with step-by-step visualization including carry bits and two\'s complement.',
});

const page = () => <BinaryArithCalculator />;
export default page;
