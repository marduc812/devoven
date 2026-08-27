import { ColumnarTransposition } from '@/Components/Functions/ColumnarTranspositionTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Columnar Transposition Cipher — Grid Transposition Encoder',
  description: 'Free online columnar transposition cipher. Arrange plaintext in rows under a keyword and read columns in alphabetical order. Includes grid visualization for encrypt and decrypt.',
};

const page = () => <ColumnarTransposition />;
export default page;
