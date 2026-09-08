import type { Metadata } from 'next';
import { StripAnsiCodes } from '@/Components/Functions/TextCleanupTools';

export const metadata: Metadata = {
  title: 'Strip ANSI Escape Codes | DevOven',
  description: 'Remove ANSI colour and cursor escape sequences from captured terminal output, or list the sequences a log contains. Runs entirely in your browser.',
};

const page = () => {
  return <StripAnsiCodes />;
};

export default page;
