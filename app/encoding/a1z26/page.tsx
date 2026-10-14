import { A1Z26Converter } from '@/Components/Functions/A1Z26Tools';
import { toolMetadata } from '@/lib/seo';

export const metadata = toolMetadata('/encoding/a1z26', {
  title: 'A1Z26 Cipher Encoder and Decoder',
  description: 'Convert A-Z letters to numbers from 1 to 26 and decode numbers back to text. Runs in your browser.',
});

export default function Page() { return <A1Z26Converter />; }
