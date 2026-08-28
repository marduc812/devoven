import { HttpRequestBuilder } from "@/Components/Functions/HttpRequestBuilderTools/index"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'HTTP Request Builder — Raw HTTP, curl, and fetch()',
    description: 'Build and format HTTP requests as raw HTTP/1.1, curl commands, or JavaScript fetch() code. Supports all HTTP methods and custom headers.'
}

const page = () => {
    return (
        <HttpRequestBuilder />
    )
}

export default page
