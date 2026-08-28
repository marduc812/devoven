import { Keccak224 } from "@/Components/Functions/Hashers/keccak224"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online Keccak-224 Hash Calculator',
    description: 'Calculate the Keccak 224 hash value for your string or binary online, securely and fast without your data ever leaving your browser.'
  }

const page = () => {
    return (
       <Keccak224 />
    )
}

export default page