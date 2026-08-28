import { PhoneFormatterTools } from '@/Components/Functions/PhoneFormatterTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phone Number Formatter - DevOven',
  description: 'Format phone numbers into multiple standard formats including E.164, RFC 3966, national, and dot notation for US/Canada and international numbers.',
};

const page = () => <PhoneFormatterTools />;
export default page;
