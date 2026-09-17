import { NumberFormatAdvanced } from '@/Components/Functions/NumberFormatAdvancedTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-format-advanced', {
  title: 'Advanced Number Formatter',
  description: 'Format numbers in scientific notation, engineering notation, SI suffixes, binary, hex, octal, and locale-aware formats.',
});

const page = () => <NumberFormatAdvanced />;
export default page;
