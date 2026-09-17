import { SHA3256 } from "@/Components/Functions/Hashers/sha3256"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha3-256', {
    title: 'Online SHA3-256 Hashing',
    description: 'Best online JavaScript SHA3-256 Hashing'
  });

const page = () => {
    return (
       <SHA3256 />
    )
}

export default page