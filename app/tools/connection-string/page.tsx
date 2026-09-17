import type { Metadata } from 'next';
import { ConnectionStringBuilder } from '@/Components/Functions/ConnectionStringTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/connection-string', {
  title: 'Connection String Builder | DevOven',
  description: 'Build database connection strings for PostgreSQL, MySQL, MongoDB, and Redis in multiple formats: URI, SQLAlchemy, JDBC, Go, Node.js, Prisma, and more.',
});

export default function Page() {
  return <ConnectionStringBuilder />;
}
