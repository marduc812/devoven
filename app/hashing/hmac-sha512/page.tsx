import { HmacSHA512 } from "@/Components/Functions/Hashers/hmacsha512"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Advanced Online HMAC-SHA512 Hash Calculator',
    description: 'Simple, fast, HMAC-SHA512 Hashing built with JavaScript running on your browser, for developers and security reseachers.'
  }

const page = () => {
    return (
       <HmacSHA512 />
    )
}

export default page