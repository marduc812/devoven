import { UlidGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ULID Generator | DevOven',
  description: 'Generate ULIDs (Universally Unique Lexicographically Sortable Identifiers) instantly in your browser.',
};

const page = () => {
  return (
    <>
      <UlidGenerator />
    </>
  );
};

export default page;
