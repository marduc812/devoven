import { HmacSHA256 } from "@/Components/Functions/Hashers/hmacsha256"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online HMAC-SHA256 Hashing Tool',
    description: 'Simple, fast, HMAC-SHA256 Hashing built with JavaScript running on your browser, for developers and security reseachers.'
  }

const page = () => {
    return (
       <HmacSHA256 />
    )
}

export default page