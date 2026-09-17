import type { Metadata } from 'next';
import { RegexTesterTool } from '@/Components/Functions/RegexTesterTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/regex-tester', {
  title: 'Regex Tester | DevOven',
  description: 'Test regular expressions in real time. Enter a pattern and test string to see all matches, positions, and capture groups. Supports g, i, m, s flags.',
});

export default function Page() {
  return <RegexTesterTool />;
}
