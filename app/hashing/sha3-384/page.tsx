import { SHA3384 } from "@/Components/Functions/Hashers/sha3384"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha3-384', {
    title: 'Online SHA3-384 Hashing',
    description: 'Best online JavaScript SHA3-384 Hashing'
  });

const page = () => {
    return (
       <SHA3384 />
    )
}

export default page