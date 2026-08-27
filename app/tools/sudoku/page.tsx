import { SudokuValidator } from '@/Components/Functions/SudokuTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sudoku Validator | DevOven',
  description: 'Validate a 9x9 Sudoku grid. Detect conflicts in rows, columns, and 3x3 boxes. Check if the puzzle is solved, in-progress, or invalid.',
};

const page = () => <SudokuValidator />;
export default page;
