import { HmacSHA1 } from "@/Components/Functions/Hashers/hmacsha1"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Reliable Online HMAC-SHA1 Hashing Tool',
  description: 'Free online HMAC-SHA1 hashing using JavaScript. Fast and secure hashing.'
}


const page = () => {
    return (
       <HmacSHA1 />
    )
}

export default page