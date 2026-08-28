import type { Metadata } from 'next';
import { VigenereEncodingConverter } from '@/Components/Functions/VigenereCipherTools';

export const metadata: Metadata = {
  title: 'Vigenère Cipher | DevOven',
  description: 'Encrypt or decrypt text using the Vigenère polyalphabetic cipher. Enter a keyword as the key — letters are shifted by varying amounts based on the repeating key.',
};

export default function Page() {
  return <VigenereEncodingConverter />;
}
