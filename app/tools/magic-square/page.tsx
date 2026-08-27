import { MagicSquareGenerator } from '@/Components/Functions/MagicSquareTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Magic Square Generator | DevOven',
  description: 'Generate magic squares of order 3-9. All rows, columns, and diagonals sum to the same magic constant. Uses Siamese method, doubly-even, and LUX algorithms.',
};

const page = () => <MagicSquareGenerator />;
export default page;
