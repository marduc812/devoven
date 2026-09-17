import { JsonToTypeScript } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/json-to-typescript', { title: 'JSON to TypeScript Interface Generator', description: 'Free online JSON to TypeScript interface generator. Generate TypeScript types from JSON instantly.' });
const page = () => <JsonToTypeScript />;
export default page;
