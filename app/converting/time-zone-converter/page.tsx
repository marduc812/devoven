import { TimezoneConverter } from '@/Components/Functions/TimezoneTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/time-zone-converter', {
  title: 'Online Time Zone Converter',
  description: 'Free online time zone converter. Convert datetimes between any major IANA timezone using built-in browser APIs. Instant Time Zone conversion.',
});

const page = () => <TimezoneConverter />;
export default page;
