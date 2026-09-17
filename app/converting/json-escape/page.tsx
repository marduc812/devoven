import { JsonEscape } from "@/Components/Functions/JsonEscapeTools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-escape', {
    title: 'Free Online JSON Escape Tool - Escape Strings for JSON',
    description: "Escape raw strings for safe use inside JSON values. Handles quotes, backslashes, newlines, tabs, and unicode control characters."
});

const page = () => {
    return (
       <JsonEscape />
    )
}

export default page
