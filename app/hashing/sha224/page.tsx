import { SHA224 } from "@/Components/Functions/Hashers/sha224"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online SHA224 Hashing',
    description: 'Best online JavaScript SHA224 Hashing'
  }

const page = () => {
    return (
       <SHA224 />
    )
}

export default page