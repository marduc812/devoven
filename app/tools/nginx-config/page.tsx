import { NginxConfigGen } from '@/Components/Functions/NginxConfigGenTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Nginx Config Generator - Generate nginx server blocks online',
    description: 'Generate nginx server block configuration for reverse proxy, static sites, SSL, and gzip from simple key=value options.',
}

const page = () => {
    return (
        <>
            <NginxConfigGen />
        </>
    )
}

export default page
