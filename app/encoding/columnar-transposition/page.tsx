import { ColumnarTransposition } from '@/Components/Functions/ColumnarTranspositionTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/columnar-transposition', {
  title: 'Columnar Transposition Cipher — Grid Transposition Encoder',
  description: 'Free online columnar transposition cipher. Arrange plaintext in rows under a keyword and read columns in alphabetical order. Includes grid visualization for encrypt and decrypt.',
});

const page = () => <ColumnarTransposition />;
export default page;
