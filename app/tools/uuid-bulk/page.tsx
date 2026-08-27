import { UuidBulkGenerator } from '@/Components/Functions/UuidBulkTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UUID Bulk Generator — Generate Many UUIDs | DevOven',
  description: 'Generate up to 1000 UUIDs v4 at once in your browser. No server required.',
};

const page = () => {
  return (
    <>
      <UuidBulkGenerator />
    </>
  );
};

export default page;
