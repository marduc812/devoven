import { UnixTimestampConverter } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online Unix Timestamp Converter',
    description: 'Free online Unix timestamp converter — supports seconds and milliseconds, convert to and from human-readable dates. Instant Unix Timestamp conversion.'
}

const page = () => {
    return (
        <UnixTimestampConverter />
    )
}

export default page
