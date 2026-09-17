import { DesDecrypt } from '@/Components/Functions/DesTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/des-decrypt', {
  title: 'DES Decrypt - Online DES Decryption Tool',
  description: 'Decrypt DES encrypted text using your password. All decryption happens client-side in your browser.',
});

const page = () => {
  return (
    <>
      <DesDecrypt />
    </>
  )
}

export default page
