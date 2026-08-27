import { UuidTimestamp } from '@/Components/Functions/UuidTimestampTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UUID to Timestamp Converter',
  description:
    'Free online UUID timestamp extractor. Extract the embedded creation timestamp from UUID v1 and UUID v7 identifiers. Shows ISO 8601, UTC, and Unix timestamp formats. Instant UUID to Timestamp conversion.',
};

const page = () => <UuidTimestamp />;
export default page;
