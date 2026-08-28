import { UnicodeEscape } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Unicode Escape / Unescape Tool',
  description: 'Encode text to \\uXXXX Unicode escape sequences or decode them back to characters.',
};

const page = () => <UnicodeEscape />;
export default page;
