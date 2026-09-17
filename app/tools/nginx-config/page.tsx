import { NginxConfigGen } from '@/Components/Functions/NginxConfigGenTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/nginx-config', {
    title: 'Nginx Config Generator - Generate nginx server blocks online',
    description: 'Generate nginx server block configuration for reverse proxy, static sites, SSL, and gzip from simple key=value options.',
});

const page = () => {
    return (
        <>
            <NginxConfigGen />
        </>
    )
}

export default page
