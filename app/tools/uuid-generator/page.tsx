import { UuidGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/uuid-generator', {
  title: 'UUID Generator — v1, v4, v7 | DevOven',
  description: 'Generate UUID v1, v4, and v7 identifiers instantly in your browser. No server required.',
});

const page = () => {
  return (
    <>
      <UuidGenerator />
    </>
  );
};

export default page;
