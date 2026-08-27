import { StringToBinary } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'

export const metadata = {
    title: 'Online String to Binary Converter',
    description: 'Online String to Binary converter. Instant String to Binary conversion.'
  }

const page = () => {
    return (
       <StringToBinary />
    )
}

export default page
