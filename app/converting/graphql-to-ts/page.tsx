import { GraphqlToTs } from '@/Components/Functions/GraphqlToTsTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/graphql-to-ts', { title: 'GraphQL Schema to TypeScript', description: 'Convert GraphQL schema definitions to TypeScript interfaces and types instantly in your browser.' });
const page = () => <GraphqlToTs />;
export default page;
