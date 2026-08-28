import { NumberFormatter } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Number Formatter',
  description: 'Format numbers with thousands separators, decimal places, and locale-specific styles.',
};

const page = () => <NumberFormatter />;
export default page;
