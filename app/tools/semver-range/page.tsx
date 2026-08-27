import type { Metadata } from 'next';
import { SemverRangeChecker } from '@/Components/Functions/SemverRangeTools';

export const metadata: Metadata = {
  title: 'Semver Range Checker | DevOven',
  description: 'Parse semver strings, validate against range expressions (^, ~, >=), compare two versions, and preview next patch/minor/major bumps.',
};

const page = () => <SemverRangeChecker />;
export default page;
