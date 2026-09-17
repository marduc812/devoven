import { Keccak256 } from "@/Components/Functions/Hashers/keccak256"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/hashing/keccak256', {
    title: 'Online Keccak-256 Hash Calculator',
    description: 'Calculate the Keccak 256 hash value for your string or binary online, securely and fast without your data ever leaving your browser.'
  });

const page = () => {
    return (
       <Keccak256 />
    )
}

export default page