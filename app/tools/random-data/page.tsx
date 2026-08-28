import { RandomDataGenerator } from '@/Components/Functions/RandomDataTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Random Data Generator - DevOven',
  description: 'Generate random test data: emails, names, phone numbers, addresses, words, sentences, UUIDs, integers, and floats. Enter commands like "10 emails" or "5 UUIDs".',
};

const page = () => <RandomDataGenerator />;
export default page;
