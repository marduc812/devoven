import type { Metadata } from 'next';
import { SqlSchemaGenerator } from '@/Components/Functions/SqlSchemaGenTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/sql-schema-gen', {
  title: 'SQL Schema Generator | DevOven',
  description: 'Generate CREATE TABLE SQL from a JSON sample. Infers column types (VARCHAR, INT, BIGINT, FLOAT, BOOLEAN, TIMESTAMP, TEXT, JSON) for PostgreSQL, MySQL, and SQLite.',
});

export default function Page() {
  return <SqlSchemaGenerator />;
}
