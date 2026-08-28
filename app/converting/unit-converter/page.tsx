import { UnitConverterExtended } from '@/Components/Functions/UnitConvertTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unit Converter - Type Any Value and Unit',
  description: 'Convert any unit by typing a value and a unit name, for example 100 mph, 30 celsius, 5 kWh or 1 atm. The category is detected automatically: length, mass, temperature, speed, pressure, energy and more.',
};

const page = () => <UnitConverterExtended />;
export default page;
