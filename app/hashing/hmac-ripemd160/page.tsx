import { HmacRIPEMD160 } from "@/Components/Functions/Hashers/hmacripemd160"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/hmac-ripemd160', {
  title: 'Advanced Online HMAC-RIPEMD160 Hashing Tool',
  description: 'JavaScript-based online tool for HMAC-RIPEMD160 hashing, essential for cybersecurity experts and software developers.'
});

const page = () => {
    return (
       <HmacRIPEMD160 />
    )
}

export default page