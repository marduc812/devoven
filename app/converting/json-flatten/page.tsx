import { JsonFlattener } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online JSON Flattener',
  description: 'Flatten nested JSON to dot-notation keys or unflatten back to nested structure.',
};

const page = () => <JsonFlattener />;
export default page;
