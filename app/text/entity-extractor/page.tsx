import { EntityExtractor } from '@/Components/Functions/EntityExtractorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entity Extractor — Extract Emails, URLs, IPs & More | DevOven',
  description: 'Extract structured data from free text: emails, URLs, phone numbers, IP addresses, dates, credit cards, hashtags, and @mentions.',
};

const page = () => {
  return (
    <>
      <EntityExtractor />
    </>
  );
};

export default page;
