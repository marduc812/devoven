import { RIPEMD160 } from "@/Components/Functions/Hashers/ripemd160"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online RIPEMD160 Hashing',
    description: 'Best online JavaScript RIPEMD160 Hashing'
  }

const page = () => {
    return (
       <RIPEMD160 />
    )
}

export default page