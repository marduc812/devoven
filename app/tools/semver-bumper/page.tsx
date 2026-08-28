import { SemverBumper } from '@/Components/Functions/SemverBumperTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semantic Versioning Bumper | DevOven',
  description: 'Analyze conventional commit messages to suggest the next semver bump (major, minor, or patch). Parses feat!, feat, fix, chore, docs and more.',
};

const page = () => <SemverBumper />;
export default page;
