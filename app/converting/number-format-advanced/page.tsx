import { NumberFormatAdvanced } from '@/Components/Functions/NumberFormatAdvancedTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advanced Number Formatter',
  description: 'Format numbers in scientific notation, engineering notation, SI suffixes, binary, hex, octal, and locale-aware formats.',
};

const page = () => <NumberFormatAdvanced />;
export default page;
