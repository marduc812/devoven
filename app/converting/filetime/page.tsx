import { FileTimeConverter } from '@/Components/Functions/TimestampIdTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Windows FILETIME to Unix Time Converter',
  description:
    'Convert a Windows FILETIME (100-nanosecond intervals since 1601) to Unix time and back. Accepts decimal, hex and the high/low 32-bit pair from Windows structures.',
};

const page = () => <FileTimeConverter />;
export default page;
