import { SHA1 } from "@/Components/Functions/Hashers/sha1"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha1', {
    title: 'Online SHA1 Hashing',
    description: 'Best online JavaScript SHA1 Hashing'
  });

const page = () => {
    return (
       <SHA1 />
    )
}

export default page