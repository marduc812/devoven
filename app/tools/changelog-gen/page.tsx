import type { Metadata } from 'next';
import { ChangelogGenerator } from '@/Components/Functions/ChangelogGenTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/changelog-gen', {
  title: 'Changelog Generator | DevOven',
  description: 'Generate a formatted CHANGELOG.md section from git commit messages. Parses conventional commits, groups by type, and suggests a version bump.',
});

export default function Page() {
  return <ChangelogGenerator />;
}
