import { Adler32 } from "@/Components/Functions/Adler32Tools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/adler32', {
    title: 'Online Adler-32 Checksum Calculator',
    description: 'Calculate the Adler-32 checksum used by zlib, in hex or decimal, in your browser.'
});

const page = () => {
    return (
        <Adler32 />
    )
}

export default page
