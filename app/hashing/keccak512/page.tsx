import { Keccak512 } from "@/Components/Functions/Hashers/keccak512"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/keccak512', {
    title: 'Advanced Online Keccak-512 Hash Calculator',
    description: 'Calculate the Keccak 512 hash value for your string or binary online, securely and fast without your data ever leaving your browser.'
  });

const page = () => {
    return (
       <Keccak512 />
    )
}

export default page