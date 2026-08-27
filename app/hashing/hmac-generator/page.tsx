import { HmacGenerator } from "@/Components/Functions/HmacTools/index"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'HMAC Generator — SHA-256, SHA-512, SHA-1, MD5',
    description: 'Generate HMAC authentication codes using SHA-256, SHA-512, SHA-1, or MD5. Fast, client-side computation for developers and security professionals.'
}

const page = () => {
    return (
        <HmacGenerator />
    )
}

export default page
