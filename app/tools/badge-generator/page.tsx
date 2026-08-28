import { BadgeGenerator } from '@/Components/Functions/BadgeGeneratorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markdown Badge Generator - DevOven',
  description: 'Generate shields.io-style markdown badges for README files. Configure label, message, color, style, logo, and link.',
};

const page = () => <BadgeGenerator />;
export default page;
