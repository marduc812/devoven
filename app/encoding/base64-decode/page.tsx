import { Base64Decode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Efficient Online Base64 to Text Decoder',
  description: 'Decode Base64 strings quickly and accurately with his online tool. Ideal for developers, data analysts, and IT professionals.'
}


const page = () => {
    return (
       <Base64Decode />
    )
}

export default page