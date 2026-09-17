import { Rc4Decrypt } from '@/Components/Functions/Rc4Tools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/rc4-decrypt', {
  title: 'RC4 Decrypt - Online RC4 Decryption Tool',
  description: 'Decrypt RC4 encrypted text using your password. All decryption happens client-side in your browser.',
});

const page = () => {
  return (
    <>
      <Rc4Decrypt />
    </>
  )
}

export default page
