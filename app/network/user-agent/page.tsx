import { UserAgentParser } from '@/Components/Functions/UserAgentTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User-Agent Parser | DevOven',
  description: 'Parse a User-Agent string into browser, version, operating system, device and rendering engine, and see what each token in it actually means. Runs entirely in your browser.',
};

const page = () => <UserAgentParser />;
export default page;
