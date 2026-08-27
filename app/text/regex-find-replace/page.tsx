import type { Metadata } from 'next';
import { RegexFindReplace } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Regex Find & Replace | DevOven',
  description: 'Apply regular expression find and replace operations to any text. Supports flags and capture groups. Runs in your browser.',
};

const page = () => <RegexFindReplace />;
export default page;
