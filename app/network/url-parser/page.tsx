import { UrlParser } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Parser - DevOven',
  description: 'Parse any URL into its components: protocol, hostname, port, path, query params, and fragment. Free online tool.',
};

const page = () => <UrlParser />;
export default page;
