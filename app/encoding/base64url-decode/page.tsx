import { Base64UrlDecode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64URL Decoder — DevOven',
  description: 'Decode Base64URL encoded text (RFC 4648 §5). Handles URL-safe characters (- and _) and missing padding automatically.',
};

const page = () => (
  <>
    <Base64UrlDecode />
  </>
);

export default page;
