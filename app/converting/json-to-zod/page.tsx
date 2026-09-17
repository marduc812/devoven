import { JsonToZod } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/json-to-zod', { title: 'JSON to Zod Schema Generator', description: 'Free online JSON to Zod schema generator. Generate Zod schemas and TypeScript types from JSON.' });
const page = () => <JsonToZod />;
export default page;
