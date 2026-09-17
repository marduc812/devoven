import { AesDecrypt } from '@/Components/Functions/SecurityTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/aes-decrypt', {
  title: 'AES Decrypt - Online AES-256-GCM Decryption Tool',
  description: 'Decrypt AES-256-GCM encrypted text using your password. All decryption happens client-side in your browser.',
});

const page = () => {
  return (
    <>
      <AesDecrypt />
    </>
  )
}

export default page
