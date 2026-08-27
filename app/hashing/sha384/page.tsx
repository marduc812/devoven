import { SHA384 } from "@/Components/Functions/Hashers/sha384"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online SHA384 Hashing',
    description: 'Best online JavaScript SHA384 Hashing'
  }

const page = () => {
    return (
       <SHA384 />
    )
}

export default page