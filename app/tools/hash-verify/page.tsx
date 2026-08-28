import type { Metadata } from 'next';
import { HashVerifier } from '@/Components/Functions/HashVerifyTools';

export const metadata: Metadata = {
  title: 'Hash Verifier | DevOven',
  description: 'Verify a file or text hash by comparing your computed hash against an expected value. Supports MD5, SHA-1, SHA-256, SHA-512, and more.',
};

const page = () => {
  return <HashVerifier />;
};

export default page;
