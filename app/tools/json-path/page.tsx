import type { Metadata } from 'next';
import { JsonPathTester } from '@/Components/Functions/JsonPathTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-path', {
  title: 'JSON Path Evaluator | DevOven',
  description: 'Evaluate JSONPath expressions against JSON documents. Supports $, dot notation, array indexing, wildcards, recursive descent, and filter expressions.',
});

export default function Page() {
  return <JsonPathTester />;
}
