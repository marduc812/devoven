import { ETHPubToAddr } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/converting/eth-public-to-address', {
    title: 'Free Online Ethereum Public Key to Address Conversion Tool',
    description: "Convert Ethereum public keys to addresses free online tool. Designed for blockchain enthusiasts, developers, and crypto traders."
  });

const page = () => {
    return (
       <ETHPubToAddr />
    )
}

export default page