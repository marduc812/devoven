import { SubstitutionCipher } from '@/Components/Functions/SubstitutionCipherTools';
import { toolMetadata } from '@/lib/seo';

export const metadata = toolMetadata('/encoding/substitution-cipher', {
  title: 'Substitution Cipher Encoder and Decoder',
  description: 'Encrypt and decrypt text with a custom 26-letter substitution alphabet. Preserves letter case and punctuation.',
});

export default function Page() { return <SubstitutionCipher />; }
