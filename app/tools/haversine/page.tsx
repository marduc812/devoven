import { HaversineDistance } from '@/Components/Functions/HaversineTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haversine Distance Calculator | DevOven',
  description: 'Calculate the great-circle distance between two geographic coordinates using the Haversine formula. Returns distance in kilometers, miles, and nautical miles.',
};

const page = () => <HaversineDistance />;
export default page;
