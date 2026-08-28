import { CurlToFetch } from '@/Components/Functions/CurlToFetchTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Curl to Fetch Converter - Convert curl to JavaScript fetch()',
  description: 'Convert curl commands to JavaScript fetch() API calls with async/await. Supports -X method, -H headers, -d body, -u basic auth, and common curl flags. Instant Curl to Fetch conversion.',
};

const page = () => <CurlToFetch />;
export default page;
