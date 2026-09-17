import type { Metadata } from 'next';
import { HttpSecurityCheck } from '@/Components/Functions/HttpSecurityCheckTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/http-security-check', {
  title: 'HTTP Security Headers Checker | DevOven',
  description: 'Analyze HTTP response headers for security best practices. Checks CSP, HSTS, X-Frame-Options, and more with severity ratings.',
});

const page = () => <HttpSecurityCheck />;
export default page;
