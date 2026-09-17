import { URLEncode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/encoding/url-encode', {
  title: 'Simple and Fast Online URL Encoder',
  description: 'Online tool to URL encode a string, with options to percent-encode every character or use the non-standard %uXXXX Unicode form. Tailored for web developers, IT specialists, and digital marketers.'
});

const page = () => {
    return (
       <URLEncode />
    )
}

export default page