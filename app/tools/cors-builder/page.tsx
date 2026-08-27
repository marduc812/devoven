import type { Metadata } from 'next';
import { CorsBuilder } from '@/Components/Functions/CorsBuilderTools';

export const metadata: Metadata = {
  title: 'CORS Policy Builder | DevOven',
  description: 'Build Cross-Origin Resource Sharing (CORS) headers for your API. Configure allowed origins, methods, headers, and credentials. Generate Access-Control-* response headers, Express.js, Nginx, and Apache configs with security warnings.',
};

export default function Page() {
  return <CorsBuilder />;
}
