import type { Metadata } from 'next';
import { UnicodeInspector } from '@/Components/Functions/UnicodeInspectorTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/unicode-inspector', {
  title: 'Unicode Character Inspector | DevOven',
  description: 'Inspect every character in your text: Unicode code point (U+XXXX), decimal, UTF-8 byte sequences, UTF-16 code units, and category. Handles emoji, combining marks, surrogate pairs, and multi-byte characters.',
});

export default function Page() {
  return <UnicodeInspector />;
}
