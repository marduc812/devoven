import { CaseConverter } from '@/Components/Functions/CaseConverterTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/multi-case', {
  title: 'Multi-Case Converter — camelCase, snake_case, kebab-case & More | DevOven',
  description: 'Convert a phrase to all common case formats at once: camelCase, PascalCase, snake_case, kebab-case, and more. Instant Multi-Case conversion.',
});

const page = () => {
  return (
    <>
      <CaseConverter />
    </>
  );
};

export default page;
