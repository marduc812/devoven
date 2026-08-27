import { Base64Encode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Fast and Reliable Online Base64 Encoder',
  description: 'Encode text to Base64 format effortlessly with this online tool. Perfect for developers, security experts, and IT professionals.'
}


const page = () => {
    return (
       <Base64Encode />
    )
}

export default page