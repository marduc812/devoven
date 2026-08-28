import { AngleConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Angle Converter',
  description: 'Free online angle unit converter. Convert between degrees, radians, and gradians instantly. 180° = π radians = 200 grad. Instant Angle conversion.',
};

const page = () => <AngleConverter />;
export default page;
