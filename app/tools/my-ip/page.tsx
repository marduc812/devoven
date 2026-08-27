import { MyIp } from "@/Components/Functions/MyIpTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'My IP Address - Check Your Public IP',
    description: 'See your public IP address, user agent, and browser language settings.',
}

const page = () => {
    return <MyIp />
}

export default page
