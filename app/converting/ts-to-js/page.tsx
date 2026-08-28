import { TsToJs } from '@/Components/Functions/TsToJsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TypeScript to JavaScript Stripper',
  description:
    'Free online TypeScript to JavaScript converter. Strip TypeScript type annotations, interfaces, and type aliases from your TypeScript code, leaving valid JavaScript.',
};

const page = () => <TsToJs />;
export default page;
