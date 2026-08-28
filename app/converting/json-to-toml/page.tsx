import { JsonToToml } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online JSON to TOML Converter', description: 'Free online JSON to TOML converter. Paste JSON and get TOML format instantly. Instant JSON to TOML conversion.' };
const page = () => <JsonToToml />;
export default page;
