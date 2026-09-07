import { SetOps } from '@/Components/Functions/SetOpsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set Operations on Two Lists Online | DevOven',
  description: 'Free online set calculator for two lists: union, intersection, difference and symmetric difference, with case-insensitive matching and duplicate counts. Runs entirely in your browser.',
};

const page = () => <SetOps />;
export default page;
