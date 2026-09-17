import { UlidGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/ulid-generator', {
  title: 'ULID Generator | DevOven',
  description: 'Generate ULIDs (Universally Unique Lexicographically Sortable Identifiers) instantly in your browser.',
});

const page = () => {
  return (
    <>
      <UlidGenerator />
    </>
  );
};

export default page;
