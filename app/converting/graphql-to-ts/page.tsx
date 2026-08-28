import { GraphqlToTs } from '@/Components/Functions/GraphqlToTsTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'GraphQL Schema to TypeScript', description: 'Convert GraphQL schema definitions to TypeScript interfaces and types instantly in your browser.' };
const page = () => <GraphqlToTs />;
export default page;
