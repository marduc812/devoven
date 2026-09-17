import { SystemdGenerator } from "@/Components/Functions/SystemdTools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/systemd', {
    title: 'systemd Service Generator - Generate .service unit files online',
    description: 'Generate systemd service unit files (.service) with Unit, Service, and Install sections from simple key=value options.',
});

const page = () => {
    return (
        <>
            <SystemdGenerator />
        </>
    )
}

export default page
