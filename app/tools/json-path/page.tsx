import type { Metadata } from 'next';
import { JsonPathTester } from '@/Components/Functions/JsonPathTools';

export const metadata: Metadata = {
  title: 'JSON Path Evaluator | DevOven',
  description: 'Evaluate JSONPath expressions against JSON documents. Supports $, dot notation, array indexing, wildcards, recursive descent, and filter expressions.',
};

export default function Page() {
  return <JsonPathTester />;
}
