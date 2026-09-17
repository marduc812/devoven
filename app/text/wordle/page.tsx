import { WordleSolverHelper } from '@/Components/Functions/WordleSolverTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/wordle', {
  title: 'Wordle Helper | DevOven',
  description: 'Solve Wordle puzzles by filtering possible answers. Enter green (known positions), yellow (wrong position), and gray (eliminated) letter constraints.',
});

const page = () => <WordleSolverHelper />;
export default page;
