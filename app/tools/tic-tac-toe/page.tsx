import { TicTacToeAnalyzer } from '@/Components/Functions/TicTacToeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/tic-tac-toe', {
  title: 'Tic-Tac-Toe Analyzer | DevOven',
  description: 'Analyze a Tic-Tac-Toe board state using the minimax algorithm. Find the optimal next move, detect wins and draws, and validate board legality.',
});

const page = () => <TicTacToeAnalyzer />;
export default page;
