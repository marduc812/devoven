import { RIPEMD160 } from "@/Components/Functions/Hashers/ripemd160"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/ripemd160', {
    title: 'Online RIPEMD160 Hashing',
    description: 'Best online JavaScript RIPEMD160 Hashing'
  });

const page = () => {
    return (
       <RIPEMD160 />
    )
}

export default page