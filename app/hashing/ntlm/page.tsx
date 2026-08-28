import { NTLM } from "@/Components/Functions/Hashers/ntlm"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'NTLM Hash Generator - Generate NTLM Hashes Online',
    description: 'Generate NTLM hashes online. NTLM uses MD4 on UTF-16LE encoded passwords and is used in Windows authentication.',
}

const page = () => {
    return <NTLM />
}

export default page
