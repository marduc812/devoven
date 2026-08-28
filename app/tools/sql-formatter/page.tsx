import { SqlFormatter } from '@/Components/Functions/SqlFormatterTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SQL Formatter — DevOven',
  description: 'Format SQL queries online with support for Standard SQL, MySQL, PostgreSQL, and BigQuery dialects.',
};

const page = () => (
  <>
    <SqlFormatter />
  </>
);

export default page;
