import { ConventionalCommitsBuilder } from '@/Components/Functions/ConventionalCommitsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conventional Commits Builder - DevOven',
  description: 'Build conventional commit messages from a simple key-value template. Supports type, scope, breaking changes, body, and footer.',
};

const page = () => <ConventionalCommitsBuilder />;
export default page;
