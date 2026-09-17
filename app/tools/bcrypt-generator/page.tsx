import { BcryptGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/bcrypt-generator', {
  title: 'Bcrypt Hash Generator & Verifier | DevOven',
  description: 'Hash passwords with bcrypt or verify a password against a bcrypt hash, entirely in your browser.',
});

const page = () => {
  return (
    <>
      <BcryptGenerator />
    </>
  );
};

export default page;
