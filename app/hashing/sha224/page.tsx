import { SHA224 } from "@/Components/Functions/Hashers/sha224"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha224', {
    title: 'Online SHA224 Hashing',
    description: 'Best online JavaScript SHA224 Hashing'
  });

const page = () => {
    return (
       <SHA224 />
    )
}

export default page