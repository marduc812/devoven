import { MyIp } from "@/Components/Functions/MyIpTools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/my-ip', {
    title: 'My IP Address - Check Your Public IP',
    description: 'See your public IP address, user agent, and browser language settings.',
});

const page = () => {
    return <MyIp />
}

export default page
