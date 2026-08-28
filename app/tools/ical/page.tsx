import { IcalGenerator } from '@/Components/Functions/IcalTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'iCal Event Generator — DevOven',
  description: 'Generate iCalendar (.ics) VEVENT format from key=value input. Supports title, start/end dates, location, description, URL, organizer, and attendees. Also parses iCal files back to structured display.',
};

const page = () => <IcalGenerator />;
export default page;
