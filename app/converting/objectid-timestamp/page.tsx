import { ObjectIdTimestamp } from '@/Components/Functions/TimestampIdTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MongoDB ObjectId to Timestamp',
  description:
    'Extract the creation time from a MongoDB ObjectId, and build the ObjectId bound for a date so you can range-query on _id. Shows ISO 8601, UTC and Unix formats.',
};

const page = () => <ObjectIdTimestamp />;
export default page;
