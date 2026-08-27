import { JsonToSql } from '@/Components/Functions/ExtraConverters3';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to SQL INSERT - DevOven',
  description: 'Convert a JSON array to SQL INSERT or CREATE TABLE statements instantly in your browser.',
};

const page = () => <JsonToSql />;
export default page;
