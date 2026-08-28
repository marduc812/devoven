import { BinaryArithCalculator } from '@/Components/Functions/BinaryArithTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Binary Arithmetic Calculator - DevOven',
  description: 'Perform addition, subtraction, multiplication, and division on binary numbers with step-by-step visualization including carry bits and two\'s complement.',
};

const page = () => <BinaryArithCalculator />;
export default page;
