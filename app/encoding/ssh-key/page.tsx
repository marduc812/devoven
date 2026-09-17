import { SshKeyInfo } from '@/Components/Functions/SshKeyTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/ssh-key', {
  title: 'SSH Key Info Parser - DevOven',
  description: 'Parse SSH public keys to extract key type, bit size, and comment. Supports RSA, DSA, ECDSA, and Ed25519 key formats.',
});

const page = () => <SshKeyInfo />;
export default page;
