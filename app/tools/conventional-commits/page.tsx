import { ConventionalCommitsBuilder } from '@/Components/Functions/ConventionalCommitsTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/conventional-commits', {
  title: 'Conventional Commits Builder - DevOven',
  description: 'Build conventional commit messages from a simple key-value template. Supports type, scope, breaking changes, body, and footer.',
});

const page = () => <ConventionalCommitsBuilder />;
export default page;
