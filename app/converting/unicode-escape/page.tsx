import { UnicodeEscape } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/unicode-escape', {
  title: 'Online Unicode Escape / Unescape Tool',
  description: 'Encode text to \\uXXXX Unicode escape sequences or decode them back to characters.',
});

const page = () => <UnicodeEscape />;
export default page;
