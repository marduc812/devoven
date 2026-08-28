import { RestToGraphql } from '@/Components/Functions/RestToGraphqlTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'REST to GraphQL — DevOven',
  description: 'Convert REST API endpoint descriptions to GraphQL type definitions, queries or mutations, and resolver skeletons. Input method, path, and optional request/response JSON.',
};

const page = () => <RestToGraphql />;
export default page;
