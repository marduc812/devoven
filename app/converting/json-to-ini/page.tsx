import { JsonToIni } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-to-ini', {
  title: 'Online JSON to INI Converter',
  description: 'Free online JSON to INI converter. Paste JSON and get INI config format instantly. Instant JSON to INI conversion.',
});

const page = () => <JsonToIni />;
export default page;
