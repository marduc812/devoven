import { HmacSHA3 } from "@/Components/Functions/Hashers/hmacsha3"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/hmac-sha3', {
  title: 'Easy Online HMAC-SHA3 Hashing Tool',
  description: "Simple, fast, HMAC-SHA3 Hashing built with JavaScript running on your browser, for developers and security reseachers."
});

const page = () => {
    return (
       <HmacSHA3 />
    )
}

export default page