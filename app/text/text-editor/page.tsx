import TextEditor from '@/Components/Functions/TextEditorTools/TextEditor';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Text Editor — Find & Replace, Regex, Line Tools | DevOven',
  description:
    'Free online text editor with find and replace, regular expressions, duplicate line removal, and file open/save. Runs entirely in your browser — nothing is uploaded.',
};

// The App Router gives this route its own JS chunk. Keeping the editor imported
// only from here is what keeps it out of every other page's bundle.
const page = () => {
  return (
    <>
      <TextEditor />
    </>
  );
};

export default page;
