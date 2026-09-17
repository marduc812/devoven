import { JsonToGoStruct } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/json-to-go-struct', { title: 'JSON to Go Struct Generator', description: 'Free online JSON to Go struct generator. Generate Go struct definitions from JSON instantly.' });
const page = () => <JsonToGoStruct />;
export default page;
