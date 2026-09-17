import type { Metadata } from 'next';
import { JsonToSql } from '@/Components/Functions/JsonToSqlTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-to-sql', {
  title: 'JSON to SQL INSERT | DevOven',
  description: 'Convert a JSON array of objects to SQL INSERT statements. Handles NULL values, string escaping, and batch inserts for PostgreSQL, MySQL, and SQLite.',
});

export default function Page() {
  return <JsonToSql />;
}
