import { Base64File } from '@/Components/Functions/Base64FileTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 File Encoder / Decoder',
  description:
    'Free online base64 file encoder and decoder. Encode any file to a base64 string or data URI, or paste a base64 string to download the original file. All processing is done locally in your browser.',
};

const page = () => <Base64File />;
export default page;
