import { CronToHuman } from '@/Components/Functions/DateTimeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cron to Human Readable',
  description: 'Free online cron expression parser. Paste a cron expression to see its human-readable description and the next 5 scheduled run times.',
};

const page = () => <CronToHuman />;
export default page;
