import { Adler32 } from "@/Components/Functions/Adler32Tools/index"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online Adler-32 Checksum Calculator',
    description: 'Calculate the Adler-32 checksum used by zlib, in hex or decimal, in your browser.'
}

const page = () => {
    return (
        <Adler32 />
    )
}

export default page
