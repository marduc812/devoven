import { RabbitEncrypt } from '@/Components/Functions/RabbitTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/rabbit-encrypt', {
  title: 'Rabbit Encrypt - Online Rabbit Cipher Encryption Tool',
  description: 'Encrypt text with the Rabbit stream cipher using a password. All encryption happens client-side in your browser.',
});

const page = () => {
  return (
    <>
      <RabbitEncrypt />
    </>
  )
}

export default page
