import type { Metadata } from 'next';
import { SourceMapInspector } from '@/Components/Functions/SourceMapInspector';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/source-map-inspector', {
  title: 'Source Map Inspector | DevOven',
  description: 'Paste a JavaScript source map to find paths, URLs, and possible secrets in its embedded source code. Runs in your browser.',
});

export default function Page() {
  return <SourceMapInspector />;
}
