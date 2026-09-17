import type { Metadata } from 'next';
import { IndentDedent } from '@/Components/Functions/TextTools2';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/indent', {
  title: 'Indent / Dedent | DevOven',
  description: 'Add or remove indentation from text, and convert between tabs and spaces, in your browser.',
});

const page = () => {
  return <IndentDedent />;
};

export default page;
