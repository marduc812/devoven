import type { Metadata } from 'next';
import { BitcoinAddrValidator } from '@/Components/Functions/BitcoinAddrTools';

export const metadata: Metadata = {
  title: 'Bitcoin Address Validator | DevOven',
  description: 'Validate Bitcoin addresses. Detects P2PKH legacy (1...), P2SH (3...), and Bech32 native SegWit (bc1...) formats with Base58Check checksum verification.',
};

const page = () => <BitcoinAddrValidator />;
export default page;
