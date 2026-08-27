import { HtpasswdGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '.htpasswd Generator (bcrypt) | DevOven',
  description: 'Generate bcrypt-hashed .htpasswd entries for Apache and Nginx in your browser.',
};

const page = () => {
  return (
    <>
      <HtpasswdGenerator />
    </>
  );
};

export default page;
