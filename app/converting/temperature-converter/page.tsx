import { TemperatureConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Temperature Converter',
  description: 'Free online temperature converter. Convert between Celsius, Fahrenheit, and Kelvin instantly. 100°C = 212°F = 373.15K. Instant Temperature conversion.',
};

const page = () => <TemperatureConverter />;
export default page;
