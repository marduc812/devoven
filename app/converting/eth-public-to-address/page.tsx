import { ETHPubToAddr } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Free Online Ethereum Public Key to Address Conversion Tool',
    description: "Convert Ethereum public keys to addresses free online tool. Designed for blockchain enthusiasts, developers, and crypto traders."
  }

const page = () => {
    return (
       <ETHPubToAddr />
    )
}

export default page