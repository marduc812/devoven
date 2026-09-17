import { JsonToYaml } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-to-yaml', {
  title: 'Online JSON to YAML Converter',
  description: 'Free online JSON to YAML converter. Paste JSON and get YAML instantly. Instant JSON to YAML conversion.',
});

const page = () => <JsonToYaml />;
export default page;
