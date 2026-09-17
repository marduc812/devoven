import { HttpRequestBuilder } from "@/Components/Functions/HttpRequestBuilderTools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/http-request', {
    title: 'HTTP Request Builder — Raw HTTP, curl, and fetch()',
    description: 'Build and format HTTP requests as raw HTTP/1.1, curl commands, or JavaScript fetch() code. Supports all HTTP methods and custom headers.'
});

const page = () => {
    return (
        <HttpRequestBuilder />
    )
}

export default page
