import { UnicodeLookup } from '@/Components/Functions/UnicodeTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Unicode Character Lookup', description: 'Look up any Unicode character or code point. See UTF-8 bytes, UTF-16 units, HTML entity, CSS escape, and JS escape.' };
const page = () => <UnicodeLookup />;
export default page;
