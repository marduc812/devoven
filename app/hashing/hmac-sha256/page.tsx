import { HmacSHA256 } from "@/Components/Functions/Hashers/hmacsha256"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/hmac-sha256', {
    title: 'HMAC-SHA256 Generator Online — Hex and Base64 | DevOven',
    description: 'Generate an HMAC-SHA256 signature online from any message and secret key, in hex or Base64. Runs entirely in your browser, so the key is never uploaded. For verifying webhooks and signing API requests.'
});

const page = () => {
    return (
       <HmacSHA256 />
    )
}

export default page
