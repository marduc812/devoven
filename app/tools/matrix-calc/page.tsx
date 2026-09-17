import type { Metadata } from 'next';
import { MatrixCalc } from '@/Components/Functions/MatrixCalcTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/matrix-calc', {
  title: 'Matrix Calculator — Add, Subtract, Multiply, Inverse | DevOven',
  description: 'Perform matrix operations in your browser: add, subtract, multiply, transpose, determinant, and inverse for any size matrices.',
});

export default function Page() {
  return <MatrixCalc />;
}
