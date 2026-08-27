import type { Metadata } from 'next';
import { SqlAnalyzer } from '@/Components/Functions/SqlBuilderTools';

export const metadata: Metadata = {
  title: 'SQL Query Analyzer | DevOven',
  description: 'Analyze and explain SQL queries — parse SELECT, INSERT, UPDATE, DELETE statements, extract tables, columns, joins, conditions, and flag performance warnings.',
};

export default function Page() {
  return <SqlAnalyzer />;
}
