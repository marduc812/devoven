import { FakeDataGenerator } from '@/Components/Functions/DevTools2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fake Data Generator - DevOven',
  description: 'Generate realistic fake test data including names, emails, phone numbers, addresses, UUIDs, IPv4s, dates, companies, URLs, and colors.',
};

const page = () => <FakeDataGenerator />;
export default page;
