import { JsonToZod } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'JSON to Zod Schema Generator', description: 'Free online JSON to Zod schema generator. Generate Zod schemas and TypeScript types from JSON.' };
const page = () => <JsonToZod />;
export default page;
