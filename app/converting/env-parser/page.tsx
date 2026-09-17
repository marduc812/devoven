import { EnvParser } from '@/Components/Functions/EnvParserAdvancedTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/env-parser', {
  title: 'Online .env Parser and Formatter',
  description:
    'Free online .env file parser and formatter. Convert .env files to JSON or format JSON back to .env syntax instantly in your browser.',
});

const page = () => <EnvParser />;
export default page;
