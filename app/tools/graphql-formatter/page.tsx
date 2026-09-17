import { GraphqlFormatter } from '@/Components/Functions/GraphqlFormatterTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/graphql-formatter', {
  title: 'GraphQL Query Formatter',
  description: 'Format and prettify GraphQL queries online. Validates basic syntax including balanced braces and parentheses, and extracts named operations.',
});

const page = () => <GraphqlFormatter />;
export default page;
