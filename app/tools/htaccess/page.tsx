import { HtaccessGenerator } from "@/Components/Functions/HtaccessTools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/htaccess', {
    title: '.htaccess Generator - Generate Apache .htaccess rules online',
    description: 'Generate Apache .htaccess rules for HTTPS redirect, www redirect, CORS, cache headers, directory listing protection, and IP blocking.',
});

const page = () => {
    return (
        <>
            <HtaccessGenerator />
        </>
    )
}

export default page
