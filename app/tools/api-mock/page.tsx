import { ApiMockGenerator } from '@/Components/Functions/ApiMockTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Mock Generator | DevOven',
  description: 'Generate mock API responses from a JSON Schema or example JSON. Output as a plain array, json-server db.json, or Mock Service Worker (MSW) handler code.',
};

const page = () => <ApiMockGenerator />;
export default page;
