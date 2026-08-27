import { HmacMD5 } from "@/Components/Functions/Hashers/hmacmd5"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Secure Online HMAC-MD5 Hashing Tool',
  description: 'This online tool offers robust HMAC-MD5 hashing, perfect for security professionals and developers.'
}


const page = () => {
    return (
       <HmacMD5 />
    )
}

export default page