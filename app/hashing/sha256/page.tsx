import { SHA256 } from "@/Components/Functions/Hashers/sha256"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/sha256', {
    title: 'Online SHA256 Hashing',
    description: 'Best online JavaScript SHA256 Hashing'
  });

const page = () => {
    return (
       <SHA256 />
    )
}

export default page