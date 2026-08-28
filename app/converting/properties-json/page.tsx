import { PropertiesJsonConverter } from '@/Components/Functions/PropertiesJsonTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Properties File to JSON — DevOven',
  description: 'Convert Java .properties files to JSON and back. Supports comments, multiline values, and unicode escapes.',
};

const page = () => <PropertiesJsonConverter />;
export default page;
