import { SHA3224 } from "@/Components/Functions/Hashers/sha3224"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online SHA3-224 Hashing',
    description: 'Best online JavaScript SHA3-224 Hashing'
  }

const page = () => {
    return (
       <SHA3224 />
    )
}

export default page