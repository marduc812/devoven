import type { Metadata } from 'next';
import { SetCookieBuilder } from '@/Components/Functions/SetCookieBuilderTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/setcookie-builder', {
  title: 'Set-Cookie Header Builder | DevOven',
  description: 'Build and parse Set-Cookie headers with security analysis for HttpOnly, Secure, and SameSite flags.',
});

const page = () => <SetCookieBuilder />;
export default page;
