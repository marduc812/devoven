import { JsonUnescape } from "@/Components/Functions/JsonEscapeTools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-unescape', {
    title: 'Free Online JSON Unescape Tool - Unescape JSON Strings',
    description: "Unescape JSON-escaped strings back to their original form. Converts escape sequences like \\n, \\t, and \\\" back to literal characters."
});

const page = () => {
    return (
       <JsonUnescape />
    )
}

export default page
