import { HmacSHA224 } from "@/Components/Functions/Hashers/hmacsha224"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Easy Online HMAC-SHA224 Hashing Tool',
  description: 'Simple, fast, HMAC-SHA224 Hashing built with JavaScript running on your browser, for developers and security reseachers.'
}


const page = () => {
    return (
       <HmacSHA224 />
    )
}

export default page