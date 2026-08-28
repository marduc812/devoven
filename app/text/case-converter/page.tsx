import type { Metadata } from 'next';
import { CaseConverter } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Case Converter | DevOven',
  description: 'Convert text to UPPER CASE, lower case, Title Case, camelCase, snake_case, kebab-case, or PascalCase instantly in your browser. Instant Case conversion.',
};

const page = () => {
  return <CaseConverter />;
};

export default page;
