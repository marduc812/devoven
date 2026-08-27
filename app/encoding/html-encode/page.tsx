import { HTMLEncode } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Advanced Online HTML Encoder',
  description: 'JavaScript Online HTML encoding for web developers and content creators. Essential for web development and content management.'
}


const page = () => {
    return (
       <HTMLEncode />
    )
}

export default page