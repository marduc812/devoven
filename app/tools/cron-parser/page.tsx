import { CronParser } from '@/Components/Functions/CronParserTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cron Expression Parser — DevOven',
  description:
    'Parse cron expressions online. Get a human-readable description, field breakdown, and the next 5 scheduled run times.',
};

const page = () => <CronParser />;
export default page;
