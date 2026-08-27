import { CookieParser } from '@/Components/Functions/NetworkTools3';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTTP Cookie Parser | DevOven',
  description: 'Parse Cookie or Set-Cookie HTTP header strings and inspect each attribute including Secure, HttpOnly, SameSite, and more.',
};

const page = () => <CookieParser />;
export default page;
