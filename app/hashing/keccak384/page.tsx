import { Keccak384 } from "@/Components/Functions/Hashers/keccak384"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Advanced Online Keccak-384 Hash Calculator',
    description: 'Calculate the Keccak 384 hash value for your string or binary online, securely and fast without your data ever leaving your browser.'
  }

const page = () => {
    return (
       <Keccak384 />
    )
}

export default page