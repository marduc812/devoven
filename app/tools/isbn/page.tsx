import { IsbnValidator } from '@/Components/Functions/IsbnTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/isbn', {
  title: 'ISBN Validator | DevOven',
  description: 'Validate ISBN-10 and ISBN-13 numbers. Accepts hyphens and spaces. Converts valid ISBN-10 to ISBN-13.',
});

const page = () => <IsbnValidator />;
export default page;
