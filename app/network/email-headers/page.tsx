import { EmailHeaderAnalyzer } from '@/Components/Functions/EmailHeaderTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Header Analyzer - DevOven',
  description: 'Parse and analyze raw email headers. View the delivery path, SPF/DKIM/DMARC authentication results, and explanations for all header fields.',
};

const page = () => <EmailHeaderAnalyzer />;
export default page;
