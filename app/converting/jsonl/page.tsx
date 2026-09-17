import type { Metadata } from 'next';
import { JsonlParser } from '@/Components/Functions/JsonlParserTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/jsonl', {
  title: 'JSONL Parser | DevOven',
  description: 'Parse JSONL (JSON Lines) to a JSON array and convert JSON arrays back to JSONL format, all in your browser.',
});

const page = () => {
  return <JsonlParser />;
};

export default page;
