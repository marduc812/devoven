import { SHA512 } from "@/Components/Functions/Hashers/sha512"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha512', {
    title: 'Online SHA512 Hashing',
    description: 'Best online JavaScript SHA512 Hashing'
  });

const page = () => {
    return (
       <SHA512 />
    )
}

export default page