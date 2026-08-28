import { JsonStats } from '@/Components/Functions/JsonStatsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Statistics Analyzer | DevOven',
  description: 'Analyze a JSON structure and get statistics: object count, array count, key count, max depth, value type distribution, and more.',
};

const page = () => <JsonStats />;
export default page;
