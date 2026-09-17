import { CryptarithSolver } from '@/Components/Functions/CryptarithTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/cryptarith', {
  title: 'Cryptarithmetic Solver | DevOven',
  description: 'Solve cryptarithmetic puzzles where letters represent unique digits. Enter puzzles like SEND + MORE = MONEY. Finds all valid digit assignments using backtracking with pruning.',
});

const page = () => <CryptarithSolver />;
export default page;
