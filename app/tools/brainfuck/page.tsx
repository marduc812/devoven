import { BrainfuckTools } from '@/Components/Functions/BrainfuckTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brainfuck Interpreter - DevOven',
  description: 'Run Brainfuck programs in your browser. Supports stdin input, bracket matching, and a 30,000-cell tape.',
};

const page = () => <BrainfuckTools />;
export default page;
