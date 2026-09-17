import { BadgeGenerator } from '@/Components/Functions/BadgeGeneratorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/badge-generator', {
  title: 'Markdown Badge Generator - DevOven',
  description: 'Generate shields.io-style markdown badges for README files. Configure label, message, color, style, logo, and link.',
});

const page = () => <BadgeGenerator />;
export default page;
