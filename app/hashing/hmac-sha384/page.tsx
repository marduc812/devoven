import { HmacSHA384 } from "@/Components/Functions/Hashers/hmacsha384"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Advanced Online HMAC-SHA384 Hash Calculator',
    description: 'Simple, fast, HMAC-SHA384 Hashing built with JavaScript running on your browser, for developers and security reseachers.'
  }

const page = () => {
    return (
       <HmacSHA384 />
    )
}

export default page