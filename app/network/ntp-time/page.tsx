import type { Metadata } from 'next';
import { NtpTimeCalculator } from '@/Components/Functions/NtpTimeTools';

export const metadata: Metadata = {
  title: 'NTP Time Calculator | DevOven',
  description: 'Convert between NTP timestamps (seconds since 1900-01-01) and Unix timestamps (seconds since 1970-01-01). Shows NTP short (32-bit) and long (64-bit) hex formats and the 70-year epoch difference.',
};

export default function Page() {
  return <NtpTimeCalculator />;
}
