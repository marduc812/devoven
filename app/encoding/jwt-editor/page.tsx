import { JwtEditor } from '@/Components/Functions/JwtEditorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWT Editor | DevOven',
  description:
    'Decode, edit, and re-sign JSON Web Tokens (JWT) live in your browser. Edit the encoded token or the decoded header, payload, and secret — both stay in sync. Verifies HMAC HS256/HS384/HS512 signatures. No data leaves your browser.',
};

const page = () => <JwtEditor />;
export default page;
