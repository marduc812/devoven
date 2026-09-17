import type { Metadata } from 'next';
import { GraphqlSchemaBuilder } from '@/Components/Functions/GraphqlSchemaTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/graphql-schema', {
  title: 'GraphQL Schema Builder | DevOven',
  description: 'Generate GraphQL type definitions from JSON example objects with correct scalar types and nested object support.',
});

const page = () => <GraphqlSchemaBuilder />;
export default page;
