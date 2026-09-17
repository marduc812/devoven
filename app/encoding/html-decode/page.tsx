import { HTMLDecode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/encoding/html-decode', {
    title: 'Online HTML Decoder',
    description: 'Best online JavaScript HTML decoder'
  });

const page = () => {
    return (
       <HTMLDecode />
    )
}

export default page