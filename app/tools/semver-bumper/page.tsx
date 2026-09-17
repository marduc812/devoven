import { SemverBumper } from '@/Components/Functions/SemverBumperTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/semver-bumper', {
  title: 'Semantic Versioning Bumper | DevOven',
  description: 'Analyze conventional commit messages to suggest the next semver bump (major, minor, or patch). Parses feat!, feat, fix, chore, docs and more.',
});

const page = () => <SemverBumper />;
export default page;
