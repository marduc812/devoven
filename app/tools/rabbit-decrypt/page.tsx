import { RabbitDecrypt } from '@/Components/Functions/RabbitTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/rabbit-decrypt', {
  title: 'Rabbit Decrypt - Online Rabbit Cipher Decryption Tool',
  description: 'Decrypt Rabbit encrypted text using your password. All decryption happens client-side in your browser.',
});

const page = () => {
  return (
    <>
      <RabbitDecrypt />
    </>
  )
}

export default page
