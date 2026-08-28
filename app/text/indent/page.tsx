import type { Metadata } from 'next';
import { IndentDedent } from '@/Components/Functions/TextTools2';

export const metadata: Metadata = {
  title: 'Indent / Dedent | DevOven',
  description: 'Add or remove indentation from text, and convert between tabs and spaces, in your browser.',
};

const page = () => {
  return <IndentDedent />;
};

export default page;
