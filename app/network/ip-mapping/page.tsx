import { IpMapping } from "@/Components/Functions/IpMappingTools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/ip-mapping', {
    title: 'IPv4/IPv6 Mapping — All IPv6 Representations of IPv4 Addresses',
    description: 'Convert IPv4 addresses to all IPv6 formats: IPv4-mapped, IPv4-compatible, 6to4, and Teredo. Also shows decimal and hex representations.'
});

const page = () => {
    return (
        <IpMapping />
    )
}

export default page
