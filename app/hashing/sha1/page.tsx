import { SHA1 } from "@/Components/Functions/Hashers/sha1"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online SHA1 Hashing',
    description: 'Best online JavaScript SHA1 Hashing'
  }

const page = () => {
    return (
       <SHA1 />
    )
}

export default page