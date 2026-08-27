import { TicTacToeAnalyzer } from '@/Components/Functions/TicTacToeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tic-Tac-Toe Analyzer | DevOven',
  description: 'Analyze a Tic-Tac-Toe board state using the minimax algorithm. Find the optimal next move, detect wins and draws, and validate board legality.',
};

const page = () => <TicTacToeAnalyzer />;
export default page;
