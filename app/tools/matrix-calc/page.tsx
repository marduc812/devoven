import type { Metadata } from 'next';
import { MatrixCalc } from '@/Components/Functions/MatrixCalcTools';

export const metadata: Metadata = {
  title: 'Matrix Calculator — Add, Subtract, Multiply, Inverse | DevOven',
  description: 'Perform matrix operations in your browser: add, subtract, multiply, transpose, determinant, and inverse for any size matrices.',
};

export default function Page() {
  return <MatrixCalc />;
}
