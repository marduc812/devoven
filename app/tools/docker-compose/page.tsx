import { DockerComposeConverter } from '@/Components/Functions/DockerComposeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Docker Compose to Run Command Converter',
    description: 'Convert docker-compose.yml service definitions to equivalent docker run commands. Supports image, ports, volumes, environment variables, restart policies, networks, container_name, and more. Instant Docker Compose to Run Command conversion.',
};

const page = () => {
    return (
        <>
            <DockerComposeConverter />
        </>
    );
};

export default page;
