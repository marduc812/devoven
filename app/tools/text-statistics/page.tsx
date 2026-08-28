import { TextStatistics } from "@/Components/Functions/DevTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Text Statistics - Word Frequency, Reading Time & Readability',
    description: 'Analyze text for word frequency, reading time estimate, Flesch readability score, character count, sentence count, and top word frequency table.',
}

const page = () => {
    return (
        <>
            <TextStatistics />
        </>
    )
}

export default page
