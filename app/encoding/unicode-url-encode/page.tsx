import { URLEncode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata = {
  title: 'Unicode URL Encoder - %uXXXX Percent Encoding',
  description: 'Online tool to encode a string using the non-standard %uXXXX Unicode URL format, with options for standard and full percent encoding.'
}


const page = () => {
    return (
       <URLEncode defaultMode="unicode" />
    )
}

export default page
