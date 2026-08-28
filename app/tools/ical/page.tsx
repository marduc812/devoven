import { IcalGenerator } from '@/Components/Functions/IcalTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'iCal Event Generator — DevOven',
  description: 'Build an iCalendar (.ics) event from a simple form: title, start and end, all-day, location, description, URL, organizer, and attendees. Times convert to UTC, the summary shows what the calendar will display, and you can download the .ics or paste an existing one to edit it.',
};

const page = () => <IcalGenerator />;
export default page;
