import { CookieParser } from '@/Components/Functions/NetworkTools3';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/cookie-parser', {
  title: 'HTTP Cookie Parser | DevOven',
  description: 'Parse Cookie or Set-Cookie HTTP header strings and inspect each attribute including Secure, HttpOnly, SameSite, and more.',
});

const page = () => <CookieParser />;
export default page;
