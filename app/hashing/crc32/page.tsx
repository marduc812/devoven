import { Crc32Tools } from '@/Components/Functions/Crc32Tools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRC32 Calculator - DevOven',
  description: 'Calculate the CRC32 checksum of any text string. Shows the result in hexadecimal, decimal, and includes the input byte count.',
};

const page = () => <Crc32Tools />;
export default page;
