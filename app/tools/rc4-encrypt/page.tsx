import { Rc4Encrypt } from '@/Components/Functions/Rc4Tools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RC4 Encrypt - Online RC4 Encryption Tool',
  description: 'Encrypt text with the RC4 stream cipher using a password. All encryption happens client-side in your browser.',
}

const page = () => {
  return (
    <>
      <Rc4Encrypt />
    </>
  )
}

export default page
