import { WeatherCalculator } from '@/Components/Functions/WeatherCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weather Calculator | DevOven',
  description: 'Calculate wind chill (NWS formula), heat index (Rothfuss formula), and dew point (Magnus formula) from temperature, wind speed, and relative humidity. Supports °C/°F and km/h/mph/m/s.',
};

const page = () => <WeatherCalculator />;
export default page;
