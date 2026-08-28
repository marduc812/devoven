import { Rc4Decrypt } from '@/Components/Functions/Rc4Tools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RC4 Decrypt - Online RC4 Decryption Tool',
  description: 'Decrypt RC4 encrypted text using your password. All decryption happens client-side in your browser.',
}

const page = () => {
  return (
    <>
      <Rc4Decrypt />
    </>
  )
}

export default page
