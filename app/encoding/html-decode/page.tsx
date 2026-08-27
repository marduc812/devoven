import { HTMLDecode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online HTML Decoder',
    description: 'Best online JavaScript HTML decoder'
  }

const page = () => {
    return (
       <HTMLDecode />
    )
}

export default page