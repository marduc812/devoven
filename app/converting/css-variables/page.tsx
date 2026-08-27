import { CssVariableExtractor } from '@/Components/Functions/CssVariableTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Variable Extractor - DevOven',
  description: 'Extract all CSS custom properties (--var: value) from CSS text. View grouped by selector or export as JSON.',
};

const page = () => <CssVariableExtractor />;
export default page;
