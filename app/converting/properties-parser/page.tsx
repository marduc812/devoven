import { PropertiesParser } from '@/Components/Functions/PropertiesParserTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/properties-parser', {
  title: 'Java Properties File Parser',
  description:
    'Free online Java .properties file parser. Convert .properties files to JSON or format JSON back to .properties syntax. Supports comments, continuation lines, and escape sequences.',
});

const page = () => <PropertiesParser />;
export default page;
