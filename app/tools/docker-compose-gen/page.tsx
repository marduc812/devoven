import type { Metadata } from 'next';
import { DockerComposeGen } from '@/Components/Functions/DockerComposeGenTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/docker-compose-gen', {
  title: 'Docker Compose Generator | DevOven',
  description: 'Generate docker-compose.yml snippets from plain English descriptions. Supports postgres, mysql, redis, nginx, mongodb, rabbitmq, elasticsearch, kafka and more.',
});

export default function Page() {
  return <DockerComposeGen />;
}
