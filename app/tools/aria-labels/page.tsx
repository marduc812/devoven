import { AriaLabelGenerator } from '@/Components/Functions/AriaLabelTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/aria-labels', {
  title: 'ARIA Label Generator - DevOven',
  description: 'Analyze HTML snippets for accessibility issues and generate ARIA label suggestions. Check buttons, images, inputs, links, and forms for missing labels.',
});

const page = () => <AriaLabelGenerator />;
export default page;
