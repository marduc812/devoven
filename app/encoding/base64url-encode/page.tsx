import { Base64UrlEncode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64URL Encoder — DevOven',
  description: 'Encode text to Base64URL format (RFC 4648 §5). Uses URL-safe characters: - instead of + and _ instead of /. No padding characters.',
};

const page = () => (
  <>
    <Base64UrlEncode />
  </>
);

export default page;
