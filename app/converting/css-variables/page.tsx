import { CssVariableExtractor } from '@/Components/Functions/CssVariableTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/css-variables', {
  title: 'CSS Variable Extractor - DevOven',
  description: 'Extract all CSS custom properties (--var: value) from CSS text. View grouped by selector or export as JSON.',
});

const page = () => <CssVariableExtractor />;
export default page;
