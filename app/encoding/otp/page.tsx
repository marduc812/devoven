import { OtpGenerator } from '@/Components/Functions/OtpGeneratorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'One-Time Pad Generator — XOR Encryption Tool',
  description: 'Free online one-time pad generator. Generate a random key and XOR-encrypt your text. Shows plaintext, key (hex and letters), and ciphertext (hex). Note: uses Math.random(), not a CSPRNG.',
};

const page = () => <OtpGenerator />;
export default page;
