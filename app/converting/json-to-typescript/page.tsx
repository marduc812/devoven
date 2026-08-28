import { JsonToTypeScript } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'JSON to TypeScript Interface Generator', description: 'Free online JSON to TypeScript interface generator. Generate TypeScript types from JSON instantly.' };
const page = () => <JsonToTypeScript />;
export default page;
