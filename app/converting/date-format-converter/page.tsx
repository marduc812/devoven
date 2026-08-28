import { DateFormatConverter } from '@/Components/Functions/DateTimeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Date Format Converter',
  description: 'Free online date format converter. Convert between ISO 8601, US (MM/DD/YYYY), EU (DD.MM.YYYY), Unix timestamp, RFC 2822, and human-readable formats instantly. Instant Date Format conversion.',
};

const page = () => <DateFormatConverter />;
export default page;
