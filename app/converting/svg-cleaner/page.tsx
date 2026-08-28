import { SvgCleanerTools } from '@/Components/Functions/SvgCleanerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVG Cleaner - DevOven',
  description: 'Remove unnecessary SVG metadata, comments, and empty elements to reduce file size. Clean XML declarations, titles, descriptions, data attributes, and empty defs.',
};

const page = () => <SvgCleanerTools />;
export default page;
