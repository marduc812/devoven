import type { Metadata } from 'next';
import { IpfsCidDecoder } from '@/Components/Functions/IpfsCidTools';

export const metadata: Metadata = {
  title: 'IPFS CID Decoder | DevOven',
  description: 'Decode IPFS Content Identifiers (CIDs). Supports CIDv0 (Qm...) and CIDv1 (base32/base58btc/hex). Shows version, codec, multihash function, and digest.',
};

const page = () => <IpfsCidDecoder />;
export default page;
