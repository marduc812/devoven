import { URLDecode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Advanced Online URL Decoder Tool',
  description: "A user-friendly online tool specializes in decoding URL-encoded strings. It's designed for quick and accurate decoding."
}


const page = () => {
    return (
       <URLDecode />
    )
}

export default page