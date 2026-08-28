import type { Metadata } from 'next';
import { DockerComposeGen } from '@/Components/Functions/DockerComposeGenTools';

export const metadata: Metadata = {
  title: 'Docker Compose Generator | DevOven',
  description: 'Generate docker-compose.yml snippets from plain English descriptions. Supports postgres, mysql, redis, nginx, mongodb, rabbitmq, elasticsearch, kafka and more.',
};

export default function Page() {
  return <DockerComposeGen />;
}
