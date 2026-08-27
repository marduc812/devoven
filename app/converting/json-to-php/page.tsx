import { JsonToPhp } from '@/Components/Functions/CodeGenTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to PHP Array — DevOven',
  description: 'Convert JSON to PHP associative array syntax. Objects become associative arrays, arrays become indexed arrays, and JSON types map to PHP equivalents.',
};

const page = () => (
  <>
    <JsonToPhp />
  </>
);

export default page;
