import { SHA3224 } from "@/Components/Functions/Hashers/sha3224"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha3-224', {
    title: 'Online SHA3-224 Hashing',
    description: 'Best online JavaScript SHA3-224 Hashing'
  });

const page = () => {
    return (
       <SHA3224 />
    )
}

export default page