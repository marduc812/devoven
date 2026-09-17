import { StringInspector } from '@/Components/Functions/StringInspectorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/string-inspector', {
  title: 'String Inspector - Bytes & Code Points',
  description: 'Inspect any string at the byte level. View UTF-8 bytes, UTF-16 code units, Unicode code points, and visual character counts.',
});

const page = () => <StringInspector />;
export default page;
