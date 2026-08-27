import { CurlToFetch } from "@/Components/Functions/DevTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'cURL to Fetch Converter - Convert curl to JavaScript fetch()',
    description: 'Convert cURL commands to JavaScript fetch() API calls instantly. Supports headers, request methods, and request body. Instant cURL to Fetch conversion.',
}

const page = () => {
    return (
        <>
            <CurlToFetch />
        </>
    )
}

export default page
