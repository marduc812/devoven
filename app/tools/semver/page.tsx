import { SemverComparator } from '@/Components/Functions/DevTools3';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semver Comparator - DevOven',
  description: 'Parse, compare, and validate semantic version strings. Check range satisfaction and bump major/minor/patch versions.',
};

const page = () => <SemverComparator />;
export default page;
