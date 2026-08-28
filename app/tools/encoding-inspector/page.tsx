import { EncodingInspector } from '@/Components/Functions/EncodingInspectorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Text Encoding Inspector',
  description:
    'Free online encoding inspector. View Unicode code points, character categories, and detect encoding issues like BOM, null bytes, zero-width characters and more.',
};

const page = () => <EncodingInspector />;
export default page;
