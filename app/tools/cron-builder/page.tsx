import { CronBuilder } from '@/Components/Functions/CronBuilderTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/cron-builder', {
  title: 'Online Cron Expression Builder',
  description:
    'Free online cron expression builder. Build and validate cron expressions visually with real-time human-readable output and common presets.',
});

const page = () => <CronBuilder />;
export default page;
