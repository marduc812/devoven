import { SHA256 } from "@/Components/Functions/Hashers/sha256"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online SHA256 Hashing',
    description: 'Best online JavaScript SHA256 Hashing'
  }

const page = () => {
    return (
       <SHA256 />
    )
}

export default page