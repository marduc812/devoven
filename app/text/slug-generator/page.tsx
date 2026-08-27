import type { Metadata } from 'next';
import { SlugGenerator } from '@/Components/Functions/SlugTools';

export const metadata: Metadata = {
  title: 'Slug Generator | DevOven',
  description: 'Generate URL slugs in multiple formats from any text. Instantly get kebab-case, snake_case, camelCase, PascalCase, and CONSTANT_CASE variants.',
};

export default function Page() {
  return <SlugGenerator />;
}
