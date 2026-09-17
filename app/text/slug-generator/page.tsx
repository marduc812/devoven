import type { Metadata } from 'next';
import { SlugGenerator } from '@/Components/Functions/SlugTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/slug-generator', {
  title: 'Slug Generator | DevOven',
  description: 'Generate URL slugs in multiple formats from any text. Instantly get kebab-case, snake_case, camelCase, PascalCase, and CONSTANT_CASE variants.',
});

export default function Page() {
  return <SlugGenerator />;
}
