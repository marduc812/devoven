import { SHA3512 } from "@/Components/Functions/Hashers/sha3512"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha3-512', {
    title: 'Online SHA3-512 Hashing',
    description: 'Best online JavaScript SHA3-512 Hashing'
  });

const page = () => {
    return (
       <SHA3512 />
    )
}

export default page