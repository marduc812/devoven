import { TripleDesDecrypt } from '@/Components/Functions/TripleDesTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/triple-des-decrypt', {
  title: 'Triple DES Decrypt - Online 3DES Decryption Tool',
  description: 'Decrypt Triple DES (3DES) encrypted text using your password. All decryption happens client-side in your browser.',
});

const page = () => {
  return (
    <>
      <TripleDesDecrypt />
    </>
  )
}

export default page
