import { FlaskSession } from '@/Components/Functions/FlaskSessionTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flask Session Cookie Decoder, Verifier & Signer',
  description:
    'Decode a Flask session cookie without the secret key, verify its itsdangerous HMAC-SHA1 signature against a key, or sign a payload of your own. Everything stays in your browser.',
};

const page = () => <FlaskSession />;
export default page;
