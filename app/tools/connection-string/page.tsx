import type { Metadata } from 'next';
import { ConnectionStringBuilder } from '@/Components/Functions/ConnectionStringTools';

export const metadata: Metadata = {
  title: 'Connection String Builder | DevOven',
  description: 'Build database connection strings for PostgreSQL, MySQL, MongoDB, and Redis in multiple formats: URI, SQLAlchemy, JDBC, Go, Node.js, Prisma, and more.',
};

export default function Page() {
  return <ConnectionStringBuilder />;
}
