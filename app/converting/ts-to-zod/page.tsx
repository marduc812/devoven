import { TsToZod } from '@/Components/Functions/TsToZodTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/ts-to-zod', { title: 'TypeScript to Zod Schema', description: 'Convert TypeScript interfaces and type definitions to Zod schemas. Supports optional fields, unions, arrays, nested objects, and enums.' });
const page = () => <TsToZod />;
export default page;
