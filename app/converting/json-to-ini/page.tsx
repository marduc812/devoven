import { JsonToIni } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online JSON to INI Converter',
  description: 'Free online JSON to INI converter. Paste JSON and get INI config format instantly. Instant JSON to INI conversion.',
};

const page = () => <JsonToIni />;
export default page;
