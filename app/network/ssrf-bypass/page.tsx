import { SsrfBypass } from '@/Components/Functions/SsrfBypassTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SSRF Bypass Payloads — IP Obfuscation Formats',
  description:
    'Convert an IP address, hostname or URL into every alternative format a parser might accept: decimal, octal, hex, dotted-hex, short form, IPv4-mapped IPv6, wildcard DNS, and URL parser-confusion payloads. Free, in-browser, nothing uploaded.',
};

const page = () => <SsrfBypass />;
export default page;
