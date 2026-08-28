import type { Metadata } from 'next';
import { EthChecksumConverter } from '@/Components/Functions/EthChecksumTools';

export const metadata: Metadata = {
  title: 'Ethereum Address Checksum (EIP-55) | DevOven',
  description: 'Convert any Ethereum address to its EIP-55 checksummed form using keccak256-based capitalization rules.',
};

const page = () => <EthChecksumConverter />;
export default page;
