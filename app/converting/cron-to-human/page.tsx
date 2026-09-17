import { CronToHuman } from '@/Components/Functions/DateTimeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/cron-to-human', {
  title: 'Cron to Human Readable',
  description: 'Free online cron expression parser. Paste a cron expression to see its human-readable description and the next 5 scheduled run times.',
});

const page = () => <CronToHuman />;
export default page;
