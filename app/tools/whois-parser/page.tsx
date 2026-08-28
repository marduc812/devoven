import { WhoisParser } from '@/Components/Functions/WhoisParserTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WHOIS Parser | DevOven',
  description: 'Parse raw WHOIS output to extract key fields like domain name, registrar, creation date, expiry date, and name servers.',
};

const page = () => <WhoisParser />;
export default page;
