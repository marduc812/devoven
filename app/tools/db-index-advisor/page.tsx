import type { Metadata } from 'next';
import { DbIndexAdvisor } from '@/Components/Functions/DbIndexAdvisorTools';

export const metadata: Metadata = {
  title: 'Database Index Advisor | DevOven',
  description: 'Paste a SQL SELECT query and get recommended CREATE INDEX statements based on WHERE, JOIN ON, ORDER BY, and GROUP BY columns, with cardinality advice.',
};

export default function Page() {
  return <DbIndexAdvisor />;
}
