import HashIdentifier from '@/Components/Functions/HashIdentifierTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hash Identifier - Name That Hash Online | DevOven',
  description: 'Identify a hash type from its format and get the hashcat mode to crack it. Recognises MD5, the SHA family, bcrypt, NTLM, Kerberos, KeePass, wallet hashes and 200+ more patterns, entirely in your browser.',
};

const page = () => <HashIdentifier />;
export default page;
