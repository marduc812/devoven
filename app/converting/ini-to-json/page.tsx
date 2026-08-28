import { IniToJson } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online INI to JSON Converter',
  description: 'Free online INI to JSON converter. Paste INI config and get JSON instantly. Instant INI to JSON conversion.',
};

const page = () => <IniToJson />;
export default page;
