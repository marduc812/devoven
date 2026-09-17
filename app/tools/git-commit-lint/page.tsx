import type { Metadata } from 'next';
import { GitCommitLinter } from '@/Components/Functions/GitCommitLintTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/git-commit-lint', {
  title: 'Git Commit Message Linter | DevOven',
  description: 'Lint git commit messages against the Conventional Commits spec. Checks type, scope, subject length, imperative mood, and breaking changes.',
});

const page = () => <GitCommitLinter />;
export default page;
