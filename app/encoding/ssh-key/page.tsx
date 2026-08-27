import { SshKeyInfo } from '@/Components/Functions/SshKeyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SSH Key Info Parser - DevOven',
  description: 'Parse SSH public keys to extract key type, bit size, and comment. Supports RSA, DSA, ECDSA, and Ed25519 key formats.',
};

const page = () => <SshKeyInfo />;
export default page;
