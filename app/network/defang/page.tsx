import UrlDefanger from '@/Components/Functions/DefangTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/defang', {
  title: 'URL Defanger & Fanger Online | DevOven',
  description: 'Defang URLs, domains, IP addresses and emails for incident reports — http://evil.com becomes hxxp://evil[.]com — or fang them back. Runs entirely in your browser.',
});

const page = () => <UrlDefanger />;
export default page;
